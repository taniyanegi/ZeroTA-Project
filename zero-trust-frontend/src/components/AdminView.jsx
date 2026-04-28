import React, { useEffect, useState } from 'react';
import './AdminView.css';

const AdminView = ({ token, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    // Refresh stats every 5 seconds to see live trust score updates and anomalies
    const intervalId = setInterval(fetchStats, 5000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Failed to fetch admin stats. Are you an admin?');
      }
    } catch (err) {
      setError('Error connecting to backend.');
    }
  };

  const handlePromote = async (username) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/promote-user/${username}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchStats();
      else alert("Failed to promote user.");
    } catch(err) { console.error(err); }
  };

  const handleRevokeAdmin = async (username) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/revoke-user/${username}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchStats();
      else alert((await response.json()).detail || "Failed to revoke admin.");
    } catch(err) { console.error(err); }
  };

  const handleToggleBlock = async (username) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/toggle-block/${username}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchStats();
      else alert((await response.json()).detail || "Failed to modify access.");
    } catch(err) { console.error(err); }
  };

  if (error) {
    return (
      <div className="admin-container error">
        <div className="glass-card">
          <h2>{error}</h2>
          <button className="logout-btn" onClick={onLogout}>Return to Login</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-container loading">
        <div className="loader-container">
          <div className="loader"></div>
          <p>Initializing AI Dashboard...</p>
        </div>
      </div>
    );
  }

  const blockedCount = stats.users.filter(u => !u.is_active).length;
  const anomalyCount = stats.recent_anomalies.length;

  const totalUsers = stats.users.length || 1;
  const highTrustCount = stats.users.filter(u => u.trust_score >= 0.8 && u.is_active).length;
  const medTrustCount = stats.users.filter(u => u.trust_score >= 0.3 && u.trust_score < 0.8 && u.is_active).length;
  const highTrustPercent = (highTrustCount / totalUsers) * 100;
  const medTrustPercent = (medTrustCount / totalUsers) * 100;

  return (
    <div className="admin-container">
      <div className="admin-content">
        <header className="admin-header glass-panel fade-in">
          <div className="header-left">
            <h2>🛡️ AI Zero Trust Control Center</h2>
            <p>Real-time Threat Monitoring & Identity Verification</p>
          </div>
          <button onClick={onLogout} className="logout-btn">Sign Out</button>
        </header>

        <div className="stats-row slide-up">
          <div className="stat-card glass-panel">
            <h3>Total Identities</h3>
            <span className="stat-number">{stats.users.length}</span>
          </div>
          <div className="stat-card glass-panel alert">
            <h3>Blocked Threats</h3>
            <span className="stat-number text-red">{blockedCount}</span>
          </div>
          <div className="stat-card glass-panel warning">
            <h3>Recent Anomalies</h3>
            <span className="stat-number text-orange">{anomalyCount}</span>
          </div>
        </div>

        <div className="dashboard-grid slide-up-delayed">
          <div className="card glass-panel">
            <div className="card-header">
              <h3>👥 Dynamic Trust Scores</h3>
              <span className="live-indicator">Live</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User Identity</th>
                    <th>Role</th>
                    <th>Trust Level</th>
                    <th>System Status</th>
                    <th>AI Recommendation</th>
                    <th>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.map((u, i) => {
                    const isTannu = (u.username || '').toLowerCase() === 'tannu';
                    return (
                    <tr key={i} className={u.trust_score < 0.5 ? 'high-risk-row' : ''}>
                      <td>
                        <div className="user-cell">
                          <span className="avatar">{(u.username || '?').charAt(0).toUpperCase()}</span>
                          {u.username || 'Unknown'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${isTannu ? 'role-admin' : u.role && u.role.toLowerCase() === 'admin' ? 'role-admin' : 'role-user'}`} style={{ whiteSpace: 'nowrap' }}>
                            {isTannu ? 'SUPER ADMIN' : u.role ? u.role.toUpperCase() : 'USER'}
                          </span>
                          
                          {isTannu ? (
                            <span style={{ fontSize: '11px', color: '#00c6ff', fontWeight: 'bold', textShadow: '0 0 5px rgba(0, 198, 255, 0.5)' }}>SYSTEM OWNER</span>
                          ) : (!u.role || u.role.toLowerCase() !== 'admin') ? (
                            <button 
                              className="action-btn" 
                              style={{ background: 'linear-gradient(to right, #8e2de2, #4a00e0)', padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handlePromote(u.username)}
                              title="Promote to Admin"
                            >
                              ⭐ + Admin
                            </button>
                          ) : (
                            <button 
                              className="action-btn" 
                              style={{ background: '#ef4444', padding: '4px 8px', fontSize: '12px', border: '1px solid #dc2626' }}
                              onClick={() => handleRevokeAdmin(u.username)}
                              title="Revoke Admin Rights"
                            >
                              ❌ - Revoke
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="progress-bar-bg">
                          <div
                            className={`progress-bar-fill ${u.trust_score < 0.5 ? 'fill-red' : 'fill-green'}`}
                            style={{ width: `${Math.max(u.trust_score * 100, 1)}%` }}
                          ></div>
                        </div>
                        <span className="trust-text">{(u.trust_score * 100).toFixed(0)}%</span>
                      </td>
                      <td>
                        {u.is_active ?
                          <span className="badge active">Verified</span> :
                          <span className="badge blocked">Terminated</span>
                        }
                      </td>
                      <td>
                        {isTannu ? (
                          <span style={{ color: '#00c6ff', fontWeight: '600', fontSize: '14px' }}>🛡️ AI Oversight Bypassed</span>
                        ) : !u.is_active ? (
                          <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '14px' }}>🔴 Threat Terminated</span>
                        ) : u.trust_score >= 0.8 ? (
                          <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '14px' }}>🟢 Normal Behavior</span>
                        ) : u.trust_score >= 0.5 ? (
                          <span style={{ color: '#facc15', fontWeight: '600', fontSize: '14px' }}>🟡 Monitor Closely</span>
                        ) : (
                          <span style={{ color: '#f97316', fontWeight: '600', fontSize: '14px' }}>🟠 Quarantine Suggested</span>
                        )}
                      </td>
                      <td>
                        {isTannu ? (
                          <span className="text-muted" style={{ fontWeight: 'bold' }}>Protected</span>
                        ) : u.is_active ? (
                          <button 
                            className="action-btn warn"
                            onClick={() => handleToggleBlock(u.username)}
                          >
                            🔒 Revoke Access
                          </button>
                        ) : (
                          <button 
                            className="action-btn danger"
                            onClick={() => handleToggleBlock(u.username)}
                          >
                            🔓 Restore Access
                          </button>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bottom-panels slide-up-delayed">
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <h3>📊 Health Distribution</h3>
              </div>
              <div className="pie-chart-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 20px' }}>
                <div 
                  className="pie-chart" 
                  style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: `conic-gradient(
                      #4caf50 0% ${highTrustPercent}%, 
                      #ffb74d ${highTrustPercent}% ${highTrustPercent + medTrustPercent}%, 
                      #e57373 ${highTrustPercent + medTrustPercent}% 100%
                    )`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    marginBottom: '25px',
                    transition: 'background 0.5s ease'
                  }}
                ></div>
                <div className="chart-legend" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', fontSize: '13px', color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: '45%' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#4caf50', marginRight: '6px', borderRadius: '50%' }}></span>High Trust</div>
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: '45%' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#ffb74d', marginRight: '6px', borderRadius: '50%' }}></span>Medium Risk</div>
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: '45%' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#e57373', marginRight: '6px', borderRadius: '50%' }}></span>Low/Blocked</div>
                </div>
              </div>
            </div>

            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <h3>🚨 Live Threat Feed</h3>
                <span className="badge blocked">{anomalyCount} Critical</span>
              </div>
              <div className="threat-list">
                {stats.recent_anomalies.length === 0 ? (
                  <div className="empty-state" style={{ height: '200px' }}>
                    <div className="empty-icon">✅</div>
                    <p>No recent anomalies detected.</p>
                  </div>
                ) : (
                  stats.recent_anomalies.map((anomaly, index) => (
                    <div className="threat-item" key={index}>
                      <div className="threat-header">
                        <span className="threat-user">👤 {anomaly.username}</span>
                        <span className="threat-time">{new Date(anomaly.time).toLocaleTimeString()}</span>
                      </div>
                      <div className="threat-details">
                        Detected Action: <strong>{anomaly.action}</strong>
                      </div>
                      <div className="threat-score">
                        Anomaly Severity: {(anomaly.anomaly_score * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
