import React, { useState } from "react";
import axios from "axios";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ResultScreen from "./components/ResultScreen";
import MFAScreen from "./components/MFAScreen";
import AdminView from "./components/AdminView";
import WelcomeScreen from "./components/WelcomeScreen";

function App() {
  const [stage, setStage] = useState("WELCOME");
  const [loginType, setLoginType] = useState(null);
  const [decisionData, setDecisionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Sending Zero Trust Payload:", payload);

      // ✅ FASTAPI + ML BACKEND CALL

      const response = await axios.post(
        "http://127.0.0.1:8000/login-risk",
        payload
      );

      const backendResponse = response.data;

      console.log("Received ML Response:", backendResponse);

      setDecisionData({
        role: backendResponse.role,
        risk_score: backendResponse.risk_score,
        decision: backendResponse.decision,
        zeroTrustData: payload,
        access_token: backendResponse.access_token // Save token for when they click proceed
      });

      // ALWAYS show the result screen first!
      setStage("RESULT");
    } catch (err) {
      console.error("Backend error:", err);
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMFASuccess = async (otp) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post("http://127.0.0.1:8000/verify-mfa", {
        username: decisionData.zeroTrustData.username,
        otp: otp
      });

      const backendResponse = response.data;
      setToken(backendResponse.access_token);

      if (backendResponse.role && backendResponse.role.toLowerCase() === "admin") {
        setStage("ADMIN");
      } else {
        setStage("RESULT");
        setDecisionData({
          ...decisionData,
          decision: "ALLOW",
        });
        startContinuousMonitoring(backendResponse.access_token);
      }
    } catch (err) {
      console.error("MFA verification failed:", err);
      setError(err.response?.data?.detail || "Invalid OTP. Please try again.");
      setStage("LOGIN"); // send back to login on failure
    } finally {
      setLoading(false);
    }
  };

  const startContinuousMonitoring = (accessToken) => {
    // Simulate user activity every 10 seconds
    setInterval(async () => {
      try {
        const activity = {
          action: "view_file",
          files_accessed: Math.floor(Math.random() * 5) + 1, // normal
          data_transferred_mb: Math.random() * 5 // normal
        };
        // Occasional anomaly
        if (Math.random() < 0.1) {
          activity.files_accessed = 60; // Anomaly!
          activity.action = "bulk_download";
        }

        const res = await axios.post("http://127.0.0.1:8000/log-activity", activity, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        console.log("Continuous Monitoring log response:", res.data);
        if (res.data.status === "blocked") {
          setError("Your session has been terminated due to suspicious activity.");
          setStage("LOGIN");
          setToken(null);
        }
      } catch (err) {
        console.error("Monitoring ping failed", err);
      }
    }, 10000);
  };

  return (
    <div style={{ minHeight: "100vh", width: "100vw" }}>
      {loading && (
        <p style={{ textAlign: "center", color: "white" }}>
          Verifying credentials...
        </p>
      )}

      {error && (
        <p style={{ textAlign: "center", color: "red" }}>
          {error}
        </p>
      )}

      {!loading && stage === "WELCOME" && (
        <WelcomeScreen
          onSelectLogin={(type) => {
            setLoginType(type);
            setStage("LOGIN");
            setError(null);
          }}
        />
      )}

      {!loading && stage === "LOGIN" && (
        <LoginForm
          loginType={loginType}
          onLogin={handleLogin}
          onSignup={() => setStage("SIGNUP")}
          onBack={() => setStage("WELCOME")}
        />
      )}

      {!loading && stage === "SIGNUP" && (
        <SignupForm
          onBackToLogin={() => setStage("LOGIN")}
        />
      )}

      {!loading && stage === "MFA" && (
        <MFAScreen onSuccess={handleMFASuccess} />
      )}

      {!loading && stage === "RESULT" && decisionData && (
        <ResultScreen
          decision={decisionData.decision}
          riskScore={decisionData.risk_score}
          onLogout={() => { setToken(null); setStage("LOGIN"); }}
          onProceed={() => {
            if (decisionData.decision === "MFA") {
              setStage("MFA");
            } else if (decisionData.decision === "ALLOW") {
              setToken(decisionData.access_token);
              if (loginType === "ADMIN" && decisionData.role && decisionData.role.toLowerCase() === "admin") {
                setStage("ADMIN");
              } else if (loginType === "ADMIN") {
                setError("Access Denied: You do not have Administrator privileges.");
                setStage("LOGIN");
                setToken(null);
              } else {
                if (decisionData.role && decisionData.role.toLowerCase() === "admin") {
                  setStage("ADMIN");
                } else {
                  // For now, if they are an employee, we leave them on the result screen 
                  // or we can create EmployeeView next.
                  alert("Employee Dashboard coming next!");
                }
              }
            }
          }}
        />
      )}

      {!loading && stage === "ADMIN" && (
        <AdminView token={token} onLogout={() => { setToken(null); setStage("LOGIN"); }} />
      )}
    </div>
  );
}

export default App;
