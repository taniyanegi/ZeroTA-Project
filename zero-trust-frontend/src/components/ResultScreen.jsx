import React from "react";
import safeBg from "../assets/safe.jpeg";
import dangerBg from "../assets/danger.jpeg";
import afterLoginBG from "../assets/afterLoginBG.png";

function ResultScreen({ decision, riskScore, onLogout, onProceed }) {
  // 🎨 Select background based on decision
  const backgroundImage =
    decision === "ALLOW"
      ? safeBg
      : decision === "BLOCK"
        ? dangerBg
        : afterLoginBG;

  const getStyle = () => {
    if (decision === "ALLOW") return { color: "#4ade80" };
    if (decision === "BLOCK") return { color: "#ef4444" };
    return { color: "#facc15" };
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={styles.container}>
        <h1 style={{ ...styles.decisionText, ...getStyle() }}>
          {decision}
        </h1>

        <p style={styles.riskText}>
          Risk Score: <strong>{(riskScore * 100).toFixed(2)}%</strong>
        </p>

        {decision === "ALLOW" && (
          <>
            <p style={styles.statusText}>✅ Access Granted</p>
            <button 
              style={{ ...styles.logoutButton, background: "rgba(74, 222, 128, 0.2)", color: "#4ade80", border: "1px solid #4ade80", marginLeft: "10px" }} 
              onClick={onProceed}
            >
              Proceed to Dashboard
            </button>
          </>
        )}

        {decision === "BLOCK" && (
          <p style={styles.statusText}>⛔ Access Denied</p>
        )}

        {decision === "MFA" && (
          <>
            <p style={styles.statusText}>🔐 Additional Verification Required.</p>
            <button 
              style={{ ...styles.logoutButton, background: "rgba(250, 204, 21, 0.2)", color: "#facc15", border: "1px solid #facc15", marginLeft: "10px" }} 
              onClick={onProceed}
            >
              Enter OTP
            </button>
          </>
        )}

        {onLogout && (
          <button style={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default ResultScreen;

const styles = {
  container: {
    width: "420px",
    padding: "40px",
    borderRadius: "16px",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 0 50px rgba(0, 150, 255, 0.5)",
    textAlign: "center",
    color: "#ffffff",
  },

  decisionText: {
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "15px",
    letterSpacing: "2px",
  },

  riskText: {
    fontSize: "20px",
    marginBottom: "20px",
    color: "#e5e7eb",
  },

  statusText: {
    fontSize: "24px",
    fontWeight: "600",
  },

  logoutButton: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "0.3s",
  },
};
