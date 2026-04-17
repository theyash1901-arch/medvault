import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { offlineStore } from '../../lib/offlineStore';
import { FiSave, FiCheckCircle, FiAlertCircle, FiUser, FiCopy, FiCheck } from 'react-icons/fi';

// Generate code: first 4 letters of name (uppercase) + 4 random digits
const generateUniqueCode = (name = '') => {
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${letters}${digits}`;
};

export default function ProfileScreen() {
  const { user, profile, fetchProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);
  const [patientCode, setPatientCode] = useState(profile?.patient_code || '');

  const copyPatientCode = () => {
    const code = patientCode || profile?.patient_code;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Auto-generate patient_code for existing patients who don't have one yet
  const ensurePatientCode = async (currentProfile) => {
    if (currentProfile?.patient_code) {
      setPatientCode(currentProfile.patient_code);
      return;
    }
    const code = generateUniqueCode(currentProfile?.full_name || '');
    const { error } = await supabase
      .from('profiles')
      .update({ patient_code: code })
      .eq('id', user.id);
    if (!error) {
      setPatientCode(code);
      if (fetchProfile) fetchProfile();
    }
  };

  useEffect(() => {
    loadProfile();
  }, [profile]);

  useEffect(() => {
    if (profile) ensurePatientCode(profile);
  }, [profile]);

  const loadProfile = async () => {
    // Try from Supabase profile first
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        blood_group: profile.blood_group || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        phone: profile.phone || '',
      });
    } else {
      // Fallback to offline store
      const cached = await offlineStore.load(`profile_${user?.id}`);
      if (cached) {
        setFormData(cached);
      }
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Save to Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: 'patient',
          ...formData,
        });

      if (error) throw error;

      // Cache locally for offline
      await offlineStore.save(`profile_${user.id}`, formData);
      await fetchProfile();

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (err) {
      // Save offline anyway
      await offlineStore.save(`profile_${user.id}`, formData);
      // Feature 6: Add to sync queue
      await offlineStore.addToSyncQueue({
        type: 'upsert_profile',
        payload: { id: user.id, role: 'patient', ...formData }
      });
      setMessage({
        type: 'error',
        text: 'Saved locally. Will sync when online.'
      });
    }

    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Your personal and emergency information</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {message.text}
          </div>
        )}

        {/* Avatar */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: '2rem', color: 'white'
          }}>
            {formData.full_name ? formData.full_name[0].toUpperCase() : <FiUser />}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {user?.email}
          </p>
        </div>

        {/* Patient ID Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Your MedVault Patient ID
            </p>
            <p style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
              {patientCode || <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Generating...</span>}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', marginTop: 4 }}>
              Share this ID to easily connect with doctors
            </p>
          </div>
          <button
            onClick={copyPatientCode}
            type="button"
            style={{
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 8, padding: '8px 12px', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600,
              transition: 'background 0.2s',
            }}
            title="Copy Patient ID"
          >
            {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--primary-light)' }}>
              Personal Information
            </h3>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                id="profile-name"
                className="form-input"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                id="profile-phone"
                className="form-input"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  id="profile-dob"
                  type="date"
                  className="form-input"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  id="profile-gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                id="profile-blood"
                className="form-select"
                value={formData.blood_group}
                onChange={(e) => handleChange('blood_group', e.target.value)}
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--danger)' }}>
              🚨 Emergency Contact
            </h3>

            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input
                id="profile-emergency-name"
                className="form-input"
                placeholder="e.g. Parent's name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                id="profile-emergency-phone"
                className="form-input"
                placeholder="+91 XXXXX XXXXX"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
              />
            </div>
          </div>

          <button
            id="profile-save"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
            ) : (
              <>
                <FiSave /> Save Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
