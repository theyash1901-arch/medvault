import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiActivity, FiShield } from 'react-icons/fi';

export default function RoleSelectionScreen() {
  const { createProfile, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState('');

  // Grab name from Google / OAuth metadata if available
  const oauthMeta = user?.user_metadata ?? {};
  const googleName = oauthMeta.full_name || oauthMeta.name || '';

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setError('');
    setDebugLog('Starting profile creation...');

    try {
      const result = await createProfile({
        role: selectedRole,
        full_name: googleName,   // pre-fill from Google if available
      });

      setDebugLog(`Result: ${JSON.stringify(result).slice(0, 500)}`);

      if (result?.error) {
        setError(result.error.message || JSON.stringify(result.error));
      }
    } catch (err) {
      setDebugLog(`Exception: ${err.message}`);
      setError(err.message || 'Error configuring role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-logo">
          <div className="logo-icon">
            <FiShield />
          </div>
          <h1>Welcome!</h1>
          <p>How will you use MedVault?</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16, wordBreak: 'break-all' }}>
            {error}
          </div>
        )}

        {debugLog && (
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: '0.7rem', color: '#aaa', wordBreak: 'break-all' }}>
            DEBUG: {debugLog}
          </div>
        )}

        <div className="role-selection">
          <div
            className={`role-card ${selectedRole === 'patient' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('patient')}
            id="role-patient"
          >
            <div className="role-card-icon patient-icon">
              <FiUser style={{ color: 'var(--primary-light)' }} />
            </div>
            <div className="role-card-text">
              <h3>I'm a Patient</h3>
              <p>Store records, generate emergency QR, share with doctors</p>
            </div>
          </div>

          <div
            className={`role-card ${selectedRole === 'doctor' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('doctor')}
            id="role-doctor"
          >
            <div className="role-card-icon doctor-icon">
              <FiActivity style={{ color: 'var(--accent-light)' }} />
            </div>
            <div className="role-card-text">
              <h3>I'm a Doctor</h3>
              <p>View patient records, scan QR codes, access shared data</p>
            </div>
          </div>
        </div>

        <button
          id="role-continue"
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 24 }}
          disabled={!selectedRole || loading}
          onClick={handleContinue}
        >
          {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : 'Continue'}
        </button>
      </div>
    </div>
  );
}
