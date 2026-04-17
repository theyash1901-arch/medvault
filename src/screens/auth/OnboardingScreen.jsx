import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiShield, FiUser, FiPhone, FiCalendar, FiHeart, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function OnboardingScreen() {
  const { profile, createProfile, user } = useAuth();
  const isDoctor = profile?.role === 'doctor';

  // Extract Google / OAuth metadata if available
  const oauthMeta = user?.user_metadata ?? {};
  const googleName = oauthMeta.full_name || oauthMeta.name || '';
  const googleAvatar = oauthMeta.avatar_url || oauthMeta.picture || '';
  const isOAuthUser = !!googleName;

  const [form, setForm] = useState({
    full_name: googleName,
    phone: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Re-sync if user object loads after initial render
  useEffect(() => {
    if (googleName) {
      setForm(prev => ({ ...prev, full_name: prev.full_name || googleName }));
    }
  }, [googleName]);

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // Generate a human-friendly unique code: first 4 letters (uppercase) + 4 random digits
  const generateUniqueCode = (name) => {
    const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
    const digits = String(Math.floor(1000 + Math.random() * 9000));
    return `${letters}${digits}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError('Full name is required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const payload = {
        role: profile.role,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
      };

      if (!isDoctor) {
        payload.date_of_birth = form.date_of_birth || null;
        payload.gender = form.gender;
        payload.blood_group = form.blood_group;
        payload.emergency_contact_name = form.emergency_contact_name.trim();
        payload.emergency_contact_phone = form.emergency_contact_phone.trim();
        // Generate a unique patient code if not already set
        if (!profile.patient_code) {
          payload.patient_code = generateUniqueCode(form.full_name.trim());
        }
      } else {
        payload.gender = form.gender;
        // Generate a unique doctor code if not already set
        if (!profile.doctor_code) {
          payload.doctor_code = generateUniqueCode(form.full_name.trim());
        }
      }

      const { error: profileError } = await createProfile(payload);
      if (profileError) {
        setError(profileError.message || JSON.stringify(profileError));
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          {googleAvatar ? (
            <img
              src={googleAvatar}
              alt="Google profile"
              style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 12, border: '3px solid var(--primary)' }}
            />
          ) : (
            <div className="logo-icon"><FiShield /></div>
          )}
          <h1>Complete Your Profile</h1>
          <p>{isDoctor ? 'Tell us about yourself, Doctor.' : 'A few details for your health record.'}</p>
        </div>

        {isOAuthUser && (
          <div className="alert" style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 10, padding: '10px 14px', color: 'var(--text)'
          }}>
            <FiCheckCircle style={{ color: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem' }}>
              Name auto-filled from Google. Please fill in the remaining details.
            </span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <FiAlertCircle />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label><FiUser /> Full Name *</label>
            <input
              className="form-input"
              placeholder={isDoctor ? 'Dr. John Smith' : 'John Smith'}
              value={form.full_name}
              onChange={e => updateField('full_name', e.target.value)}
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label><FiPhone /> Phone Number</label>
            <input
              className="form-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
            />
          </div>

          {/* Gender - for both */}
          <div className="form-group">
            <label>Gender</label>
            <select
              className="form-select"
              value={form.gender}
              onChange={e => updateField('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Patient-only fields */}
          {!isDoctor && (
            <>
              <div className="form-group">
                <label><FiCalendar /> Date of Birth</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.date_of_birth}
                  onChange={e => updateField('date_of_birth', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label><FiHeart /> Blood Group</label>
                <select
                  className="form-select"
                  value={form.blood_group}
                  onChange={e => updateField('blood_group', e.target.value)}
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A−</option>
                  <option value="B+">B+</option>
                  <option value="B-">B−</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB−</option>
                  <option value="O+">O+</option>
                  <option value="O-">O−</option>
                </select>
              </div>

              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  className="form-input"
                  placeholder="Parent / Guardian name"
                  value={form.emergency_contact_name}
                  onChange={e => updateField('emergency_contact_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label><FiPhone /> Emergency Contact Phone</label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.emergency_contact_phone}
                  onChange={e => updateField('emergency_contact_phone', e.target.value)}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span> : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
