import React, { useState } from "react";
import "./SignupForm.css";
import bgImage from "../assets/bg.png";
import { signup } from "../services/api";

function SignupForm({ onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim();

    if (!username || !cleanEmail || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await signup(username, password, cleanEmail);
      alert("✅ Account created successfully! Please log in.");
      onBackToLogin();
    } catch (err) {
      const backendMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
      setError(backendMsg || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-background" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="login-card">
        {error && <div className="error-message">{error}</div>}

        <div className="input-box">
          <span className="icon">👤</span>
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="input-box">
          <span className="icon">📧</span>
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="input-box">
          <span className="icon">🔒</span>
          <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className="icon" onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>{showPassword ? "🙈" : "👁️"}</span>
        </div>

        <div className="password-criteria">
          <div>{password.length >= 7 && password.length <= 15 ? "✅" : "❌"} 7 to 15 characters</div>
          <div>{/[A-Z]/.test(password) ? "✅" : "❌"} At least 1 uppercase letter</div>
          <div>{/\d/.test(password) ? "✅" : "❌"} At least 1 digit</div>
          <div>{/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password) ? "✅" : "❌"} At least 1 special character</div>
        </div>

        <div className="input-box">
          <span className="icon">🔒</span>
          <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <span className="icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: "pointer" }}>{showConfirmPassword ? "🙈" : "👁️"}</span>
        </div>

        <button className="login-btn" onClick={handleSignup} disabled={loading}>{loading ? "Creating Account..." : "SIGN UP"}</button>
        <p className="switch-text" onClick={onBackToLogin}>← Back to Login</p>
      </div>
    </div>
  );
}

export default SignupForm;
