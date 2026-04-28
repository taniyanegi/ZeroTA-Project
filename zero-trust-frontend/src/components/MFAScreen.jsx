import React, { useState } from "react";
import afterLoginBG from "../assets/afterLoginBG.png";

function MFAScreen({ onSuccess }) {
  const [otp, setOtp] = useState("");

  const handleVerify = () => {
    if (otp.length > 0) {
      onSuccess(otp);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(${afterLoginBG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={styles.container}>
        <h2 style={styles.title}>Multi-Factor Authentication</h2>

        <p style={styles.description}>
          OTP has been sent to your registered mail *******@gmail.com<br/>
          Please check your mail.
        </p>

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleVerify} style={styles.button}>
          Verify
        </button>
      </div>
    </div>
  );
}

export default MFAScreen;

const styles = {
  container: {
  width: "420px",
  padding: "40px",
  borderRadius: "16px",
  background: "rgba(0, 0, 0, 0.7)",
  backdropFilter: "blur(14px)",

  /* 🔵 GLOWING EDGE */
  border: "2px solid rgba(0, 180, 255, 0.8)",
  boxShadow: `
    0 0 10px rgba(0, 180, 255, 0.6),
    0 0 25px rgba(0, 180, 255, 0.5),
    0 0 50px rgba(0, 180, 255, 0.4)
  `,

  textAlign: "center",
  color: "#ffffff",

  /* ✨ optional smooth animation */
  animation: "glowPulse 2.5s infinite ease-in-out",
},

  title: {
    fontSize: "28px",          // ⬅️ bigger heading
    marginBottom: "15px",
  },

  description: {
    fontSize: "16px",          // ⬅️ bigger text
    color: "#cbd5e1",
    marginBottom: "25px",
    lineHeight: "1.5",
  },

  input: {
    width: "90.9%",
    padding: "14px",           // ⬅️ bigger input
    fontSize: "18px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
    marginBottom: "20px",
    textAlign: "center",
  },

  button: {
    width: "100%",
    padding: "14px",
    fontSize: "18px",          // ⬅️ bigger button text
    fontWeight: "600",
    cursor: "pointer",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(to right, #1d9bf0, #00c6ff)",
    color: "#ffffff",
  },
};
