from pyexpat import features

from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from datetime import datetime
import numpy as np
import joblib
import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from sklearn.ensemble import IsolationForest

# ==========================
# Local Imports (FIXED ✅)
# ==========================
from .database import SessionLocal, engine
from . import models
from .auth import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

# ==========================
# App
# ==========================
app = FastAPI(title="Zero Trust Auth + ML Backend")

# ==========================
# CORS
# ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# DB Init
# ==========================
models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================
# Password Hashing
# ==========================
# Support both argon2 and bcrypt for backwards compatibility
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

# ==========================
# 🧠 AI Phase 1: Load Initial Risk Model (Random Forest)
# ==========================
# This model evaluates the initial login attempt (Context-based access).
# It was trained on historical data to identify risky login patterns.
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "zero_trust_random_forest.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "feature_scaler.pkl")

rf_model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

print("✅ Random Forest Login model loaded")

# ==========================
# 🧠 AI Phase 2: Load Isolation Forest for Continuous Monitoring
# ==========================
# In Zero Trust, we "Never Trust, Always Verify".
SESSION_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "session_model.pkl")
print("⚙️ Loading Isolation Forest for Continuous Monitoring...")
isolation_forest = joblib.load(SESSION_MODEL_PATH)
print("✅ Isolation Forest model loaded")

# ==========================
# Schemas
# ==========================
class SignupRequest(BaseModel):
    username: str
    password: str
    email: str

class LoginRequest(BaseModel):
    username: str
    password: str
    hour: int | None = None
    day_of_week: int | None = None
    is_weekend: int | None = None
    rtt: float | None = None
    asn: int | None = None
    ip_octet1: int | None = None
    country: str | None = None
    browser: str | None = None

class VerifyMFARequest(BaseModel):
    username: str
    otp: str

# ==========================
# Email utility
# ==========================
def send_otp_email(to_email: str, otp: str):
    # This is a real SMTP setup for Gmail. 
    # For now, it prints the OTP to the console so you can test it immediately!
    print(f"\n📧 [EMAIL SYSTEM] Sending OTP {otp} to {to_email}\n")
    
    # Fetch credentials securely from .env
    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_APP_PASSWORD")
    
    if not sender_email or not sender_password:
        print("❌ ERROR: SMTP_EMAIL or SMTP_APP_PASSWORD missing in .env file!")
        return
    
    msg = MIMEText(f"Your Zero Trust OTP is: {otp}. It expires in 5 minutes.")
    msg['Subject'] = 'Your Login OTP'
    msg['From'] = sender_email
    msg['To'] = to_email
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [to_email], msg.as_string())
        print("✅ Email sent successfully to", to_email)
    except Exception as e:
        print("❌ Failed to send email:", e)

# ==========================
# Zero Trust Logic
# ==========================
def zero_trust_decision(risk: float) -> str:
    if risk < 0.01:
        return "ALLOW"
    elif risk < 0.05:
        return "MFA"
    return "BLOCK"

# ==========================
# Telemetry Simulation
# ==========================
def simulate_rtt(ip_octet1: int) -> float:
    return round(40 + ip_octet1 % 40 + random.uniform(5, 30), 2)

def simulate_asn(ip_octet1: int) -> int:
    return 20000 + (ip_octet1 * 37) % 4000

def simulate_country(ip_octet1: int) -> str:
    return "IN" if ip_octet1 < 128 else "OTHER"

# ==========================
# Health Check
# ==========================
@app.get("/")
def root():
    return {"message": "Backend running"}

# ==========================
# SIGNUP
# ==========================
@app.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):

    import re
    if len(data.password) <= 7 or len(data.password) > 15:
        raise HTTPException(status_code=400, detail="Password must be between 8 and 15 characters")
    if not re.search(r"[A-Z]", data.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"\d", data.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]", data.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")

    existing_user = db.query(models.User).filter(
        models.User.username == data.username
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    existing_email = db.query(models.User).filter(
        models.User.email == data.email
    ).first()

    if existing_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = pwd_context.hash(data.password)

    new_user = models.User(
        username=data.username,
        email=data.email,
        password=hashed_password,
        role="user"

    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 🖨️ Print to terminal to show the user what it looks like!
    print(f"\n--- NEW USER CREATED ---")
    print(f"Username: {data.username}")
    print(f"Raw Password: {data.password}")
    print(f"Hashed Password saved to DB: {hashed_password}")
    print(f"------------------------\n")

    return {"message": "Signup successful", "username": data.username}


# ==========================
# DEBUG: list users (temporary)
# ==========================
@app.get("/debug/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat() if getattr(u, 'created_at', None) else None,
        })
    return result

# ==========================
# LOGIN + ML RISK EVALUATION
# ==========================
@app.post("/login-risk")
def login_risk(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    # Step 1: Traditional verification (Check username/password)
    user = db.query(models.User).filter(
    (models.User.username == data.username) | (models.User.email == data.username)
).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Step 2: Contextual Data Gathering
    # Collect IP, Time, Day, and Browser Agent to feed the AI
    hour = data.hour
    day_of_week = data.day_of_week
    is_weekend = data.is_weekend

    client_ip = request.client.host
    try:
      if "." in client_ip:
        ip_octet1 = int(client_ip.split(".")[0])
      else:
        ip_octet1 = 127
    except:
        ip_octet1 = 127

  
    
    browser = (data.browser or "chrome").lower()
    browser_chrome = 1 if browser == "chrome" else 0
    browser_edge = 1 if browser == "edge" else 0
    browser_other = 1 if browser_chrome == 0 and browser_edge == 0 else 0

   
    rtt = data.rtt
    asn = data.asn
    ip_octet1 = data.ip_octet1
    country = data.country
    country_in = 1 if country == "IN" else 0

    # Step 3: Run Random Forest AI Prediction
    features = np.array([[
        rtt,
        asn,
        hour,
        day_of_week,
        is_weekend,
        ip_octet1,
        country_in,
        browser_chrome,
        browser_edge,
        browser_other
    ]])
    
    features_scaled = scaler.transform(features)

    print("FEATURES USED:", features)

    risk_score = rf_model.predict_proba(features_scaled)[0][1]

    # Admins bypass the Zero Trust ML evaluation to ensure they can always access the dashboard
    if user.role and user.role.lower() == "admin":
        risk_score = 0.0
        decision = "ALLOW"
    else:
        decision = zero_trust_decision(risk_score)

    # 🔗 DYNAMIC TRUST SCORE UPDATE
    # Update the actual trust score in the database instantly based on this login attempt
    if user.username.lower() != "tannu":
        user.trust_score = max(0.0, min(1.0, 1.0 - float(risk_score)))
        db.commit()

    print("DECISION:", decision)
    response_data = {
        "username": data.username,
        "role": user.role,
        "risk_score": round(float(risk_score), 4),
        "decision": decision
    }

    # Step 4: Grant Access & Issue JWT Ticket
    if decision == "ALLOW":
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        response_data["access_token"] = access_token
        response_data["token_type"] = "bearer"
        
        # Token is already issued, no need to touch trust score again since it was set above.
    elif decision == "MFA":
        # Generate a 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        user.otp_code = otp_code
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
        db.commit()
        
        # Send Email
        send_otp_email(user.email, otp_code)
        
    elif decision == "BLOCK":
        if user.username.lower() != "tannu":
            user.is_active = False
            # Log the critical threat so it appears in the Live Threat Feed
            log_entry = models.SessionLog(
                user_id=user.id,
                ip_address=request.client.host,
                action="malicious_login_attempt",
                anomaly_score=float(risk_score)
            )
            db.add(log_entry)
            db.commit()

    return response_data

# ==========================
# MFA VERIFICATION
# ==========================
@app.post("/verify-mfa")
def verify_mfa(data: VerifyMFARequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        (models.User.username == data.username) | (models.User.email == data.username)
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No OTP requested")
        
    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")
        
    if user.otp_code != data.otp:
        raise HTTPException(status_code=401, detail="Invalid OTP")
        
    # Clear OTP
    user.otp_code = None
    user.otp_expires_at = None
    
    # Issue token since MFA passed
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    if user.trust_score < 1.0:
        user.trust_score = min(1.0, user.trust_score + 0.05)
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "decision": "ALLOW"
    }

# ==========================
# CONTINUOUS MONITORING
# ==========================
class ActivityLog(BaseModel):
    action: str
    files_accessed: int
    data_transferred_mb: float

@app.post("/log-activity")
def log_activity(
    activity: ActivityLog,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 🧠 USE REAL MACHINE LEARNING MODEL (Isolation Forest)
    # The model expects an array of features: [files_accessed, data_transferred]
    features = np.array([[activity.files_accessed, activity.data_transferred_mb]])
    
    # predict() returns 1 for normal, -1 for anomaly
    is_anomaly = isolation_forest.predict(features)[0] == -1
    
    # decision_function() returns negative scores for anomalies, positive for normal
    raw_score = isolation_forest.decision_function(features)[0]
    
    # Convert raw score into a 0.0 to 1.0 probability for our trust system
    if is_anomaly:
        anomaly_score = min(1.0, abs(raw_score) * 2 + 0.5)  # High score for anomaly
    else:
        anomaly_score = max(0.0, 0.2 - raw_score) # Low score for normal

    # Update trust score based on anomaly
    if current_user.username.lower() != "tannu":
        if anomaly_score > 0.6:
            current_user.trust_score = max(0.0, current_user.trust_score - 0.3)
        elif anomaly_score > 0.3:
            current_user.trust_score = max(0.0, current_user.trust_score - 0.1)
        else:
            current_user.trust_score = min(1.0, current_user.trust_score + 0.01)

    log_entry = models.SessionLog(
        user_id=current_user.id,
        ip_address=request.client.host,
        action=activity.action,
        anomaly_score=anomaly_score
    )
    db.add(log_entry)
    db.commit()

    if current_user.trust_score < 0.3:
        # Block user automatically
        current_user.is_active = False
        db.commit()
        return {"status": "blocked", "message": "Account suspended due to abnormal activity."}

    return {
        "status": "ok", 
        "anomaly_score": anomaly_score, 
        "current_trust": round(current_user.trust_score, 2)
    }

# ==========================
# ADMIN DASHBOARD STATS
# ==========================
@app.get("/admin/stats")
def get_admin_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.role or current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = db.query(models.User).all()
    logs = db.query(models.SessionLog).order_by(models.SessionLog.timestamp.desc()).limit(50).all()
    
    return {
        "users": [{"username": u.username, "role": u.role, "trust_score": u.trust_score, "is_active": u.is_active} for u in users],
        "recent_anomalies": [{"username": l.user.username if l.user else "Unknown", "action": l.action, "anomaly_score": l.anomaly_score, "time": l.timestamp} for l in logs if l.anomaly_score > 0.5]
    }

# ==========================
# ADMIN ROLE MANAGEMENT
# ==========================
@app.post("/admin/promote-user/{username}")
def promote_user(username: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.role or current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can grant admin rights")
    
    target_user = db.query(models.User).filter(models.User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_user.role = "admin"
    db.commit()
    return {"message": f"{username} has been promoted to admin"}

@app.post("/admin/revoke-user/{username}")
def revoke_admin(username: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.role or current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can modify admin rights")
    if username.lower() == "tannu":
        raise HTTPException(status_code=403, detail="Cannot revoke rights of the permanent Super Admin")
    
    target_user = db.query(models.User).filter(models.User.username == username).first()
    if not target_user: raise HTTPException(status_code=404, detail="User not found")
    if current_user.username == target_user.username: raise HTTPException(status_code=400, detail="Cannot revoke your own admin rights")
    target_user.role = "user"
    db.commit()
    return {"message": "Success"}

@app.post("/admin/toggle-block/{username}")
def toggle_block(username: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.role or current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can block/unblock users")
    if username.lower() == "tannu":
        raise HTTPException(status_code=403, detail="Cannot block the permanent Super Admin")
        
    target_user = db.query(models.User).filter(models.User.username == username).first()
    if not target_user: raise HTTPException(status_code=404, detail="User not found")
    if current_user.username == target_user.username: raise HTTPException(status_code=400, detail="Cannot block yourself")
    target_user.is_active = not target_user.is_active
    db.commit()
    return {"message": "Success"}

