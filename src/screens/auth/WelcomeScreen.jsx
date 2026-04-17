import { Link } from 'react-router-dom';
import { FiShield, FiFileText, FiMaximize, FiSmartphone, FiArrowRight } from 'react-icons/fi';

export default function WelcomeScreen() {
  return (
    <div className="welcome-page">
      {/* Hero Section */}
      <div className="welcome-hero">
        <div className="welcome-logo-pulse">
          <div className="welcome-logo">
            <FiShield />
          </div>
        </div>
        <h1 className="welcome-title">MedVault</h1>
        <p className="welcome-subtitle">
          Your health records, secured &amp; accessible — anytime, anywhere.
        </p>
      </div>

      {/* Features */}
      <div className="welcome-features">
        <div className="welcome-feature">
          <div className="welcome-feature-icon" style={{ background: 'rgba(0, 210, 255, 0.1)' }}>
            <FiFileText style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h3>Store Records</h3>
            <p>Upload prescriptions, lab tests &amp; reports securely in the cloud.</p>
          </div>
        </div>
        <div className="welcome-feature">
          <div className="welcome-feature-icon" style={{ background: 'rgba(32, 227, 178, 0.1)' }}>
            <FiMaximize style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3>Emergency QR</h3>
            <p>Generate a QR code with your medical summary — works offline.</p>
          </div>
        </div>
        <div className="welcome-feature">
          <div className="welcome-feature-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <FiSmartphone style={{ color: '#A78BFA' }} />
          </div>
          <div>
            <h3>Share Securely</h3>
            <p>Grant and revoke doctor access to your records with one tap.</p>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="welcome-actions">
        <Link to="/login" className="btn btn-primary btn-full btn-lg" id="welcome-signin">
          Sign In <FiArrowRight />
        </Link>
        <Link to="/signup" className="btn btn-outline btn-full btn-lg" id="welcome-signup">
          Create Account
        </Link>
      </div>

      <p className="welcome-footer">
        Built for patients &amp; doctors across India 🇮🇳
      </p>
    </div>
  );
}
