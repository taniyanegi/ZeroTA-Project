import React from 'react';
import './LoginForm.css';
import bgImage from "../assets/bg.png";

const WelcomeScreen = ({ onSelectLogin }) => {
  return (
    <div
      className="login-background"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="login-card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ccc', marginBottom: '30px', fontSize: '18px' }}>Please select your portal</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            className="login-btn" 
            style={{ padding: '15px', fontSize: '16px' }}
            onClick={() => onSelectLogin('USER')}
          >
            LOGIN AS USER
          </button>
          
          <button 
            className="login-btn" 
            style={{ padding: '15px', fontSize: '16px', background: 'linear-gradient(to right, #8e2de2, #4a00e0)' }}
            onClick={() => onSelectLogin('ADMIN')}
          >
            LOGIN AS ADMIN
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
