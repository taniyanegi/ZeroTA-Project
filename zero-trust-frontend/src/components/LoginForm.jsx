import React, { useState } from "react";
import "./LoginForm.css";
import bgImage from "../assets/bg.png";

function LoginForm({ onLogin, onSignup, loginType, onBack }) {
  const [username, setUsername] = useState(localStorage.getItem("rememberUser") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const now = new Date();
    const day = now.getDay();

   
const zeroTrustPayload = {
  username: username,
  password: password,
  hour: new Date().getHours(),
  day_of_week: new Date().getDay(),
  is_weekend: (new Date().getDay() === 0 || new Date().getDay() === 6) ? 1 : 0,
  rtt: 40,
  asn: 20000,
  ip_octet1: 100,
  country: "IN",
  browser: "Chrome", 
};

    if (rememberMe) {
      localStorage.setItem("rememberUser", username);
    } else {
      localStorage.removeItem("rememberUser");
    }

    await onLogin(zeroTrustPayload);
    setLoading(false);
  };

  return (
    <div
      className="login-background"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="login-card">

        <div className="input-box">
          <span className="icon">👤</span>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-box">
          <span className="icon">🔒</span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="icon"
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: "pointer" }}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <div className="options">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            Remember Me
          </label>
        </div>

        <button 
          className="login-btn" 
          onClick={handleLogin} 
          disabled={loading}
          style={loginType === 'ADMIN' ? { background: 'linear-gradient(to right, #8e2de2, #4a00e0)' } : {}}
        >
          {loading ? "Logging in..." : `LOGIN AS ${loginType}`}
        </button>

        <p className="signup-text">
          Don’t have an account?{" "}
          <span className="signup-link" onClick={onSignup}>
            Create Account
          </span>
        </p>
        
        <p className="signup-text" style={{ marginTop: '10px' }}>
          <span className="signup-link" onClick={onBack}>
            ← Back to Portal Selection
          </span>
        </p>

      </div>
    </div>
  );
}

export default LoginForm;