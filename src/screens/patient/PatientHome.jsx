import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiFileText, FiHeart, FiMaximize, FiShield, FiUser, FiAlertTriangle } from 'react-icons/fi';

export default function PatientHome() {
  const { profile } = useAuth();
  const displayName = profile?.full_name || 'Patient';
  const greeting = getGreeting();

  return (
    <div className="page">
      <div className="container">
        {/* Greeting */}
        <div className="page-header" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>{greeting}</p>
          <h1 style={{ fontSize: '1.6rem' }}>
            {displayName === 'Patient' ? 'Welcome!' : `Hi, ${displayName.split(' ')[0]}!`}
          </h1>
        </div>

        {/* Profile completion reminder */}
        {(!profile?.full_name || !profile?.blood_group) && (
          <Link to="/patient/profile" style={{ textDecoration: 'none' }}>
            <div className="alert alert-info" style={{ cursor: 'pointer', marginBottom: 20 }}>
              <FiAlertTriangle />
              Complete your profile for better emergency QR codes
            </div>
          </Link>
        )}

        {/* Quick Stats */}
        <div className="summary-grid">
          <Link to="/patient/reports" style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FiFileText style={{ color: 'var(--primary)' }} />
                <span className="stat-label">Reports</span>
              </div>
              <div className="stat-value">—</div>
            </div>
          </Link>
          <Link to="/patient/summary" style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FiHeart style={{ color: 'var(--danger)' }} />
                <span className="stat-label">Health</span>
              </div>
              <div className="stat-value">View</div>
            </div>
          </Link>
        </div>

        {/* Action Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/patient/qr" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--primary-glow), rgba(56, 189, 248, 0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiMaximize style={{ color: 'var(--primary-light)', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Emergency QR Code</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Show your medical summary instantly — works offline
                </p>
              </div>
            </div>
          </Link>

          <Link to="/patient/reports" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiFileText style={{ color: 'var(--accent-light)', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Upload Reports</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Store prescriptions, lab tests, X-rays securely
                </p>
              </div>
            </div>
          </Link>

          <Link to="/patient/access" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiShield style={{ color: 'var(--warning)', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Access Control</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Manage which doctors can see your records
                </p>
              </div>
            </div>
          </Link>

          <Link to="/patient/profile" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiUser style={{ color: '#A78BFA', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>My Profile</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Personal info, emergency contacts, medical details
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '☀️ Good morning';
  if (h < 17) return '🌤️ Good afternoon';
  return '🌙 Good evening';
}
