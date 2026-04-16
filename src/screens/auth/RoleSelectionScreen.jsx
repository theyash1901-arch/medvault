import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiUser, FiActivity, FiShield } from 'react-icons/fi';

export default function RoleSelectionScreen() {
  const { createProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setError('');

    const { error: profileError } = await createProfile({
      role: selectedRole,
      full_name: '',
    });

    if (profileError) {
      setError(profileError.message);
    }
    setLoading(false);
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
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
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
