from sqlalchemy import create_engine, text
from passlib.context import CryptContext

engine = create_engine("sqlite:///D:/OneDrive/Desktop/ZeroTA/zta-backend/users.db")
pwd = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

with engine.connect() as conn:
    row = conn.execute(
        text("SELECT id, username, email, password FROM users WHERE username=:u"),
        {"u": "tanu"}
    ).fetchone()

    print("DB row:", row)

    if row:
        stored_hash = row[3]
        print("Stored hash prefix:", stored_hash[:6])

        # replace the password below with the exact password used at signup
        ok = pwd.verify("tanu@12", stored_hash)
        print("verify result:", ok)
