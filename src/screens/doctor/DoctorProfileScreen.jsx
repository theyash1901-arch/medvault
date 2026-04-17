import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiUser, FiBriefcase, FiAward, FiMapPin, FiSave, FiLogOut, FiCopy, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Generate code: first 4 letters of name (uppercase) + 4 random digits
const generateDoctorCode = (name = '') => {
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${letters}${digits}`;
};

export default function DoctorProfileScreen() {
  const { user, profile, signOut, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    specialization: '',
    license_number: '',
    hospital_clinic: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [doctorCode, setDoctorCode] = useState(profile?.doctor_code || '');

  const copyDoctorCode = () => {
    const code = doctorCode || profile?.doctor_code;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Auto-generate doctor_code for existing doctors who don't have one yet
  const ensureDoctorCode = async (currentProfile) => {
    if (currentProfile?.doctor_code) {
      setDoctorCode(currentProfile.doctor_code);
      return;
    }
    const code = generateDoctorCode(currentProfile?.full_name || '');
    const { error } = await supabase
      .from('profiles')
      .update({ doctor_code: code })
      .eq('id', user.id);
    if (!error) {
      setDoctorCode(code);
      if (fetchProfile) fetchProfile(); // refresh AuthContext profile
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  // Run ensureDoctorCode whenever profile loads/changes
  useEffect(() => {
    if (profile) ensureDoctorCode(profile);
  }, [profile]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data) {
        setFormData({
          specialization: data.specialization || '',
          license_number: data.license_number || '',
          hospital_clinic: data.hospital_clinic || '',
        });
      }
    } catch (err) {
      // Table might be initially empty
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload = {
        id: user.id,
        specialization: formData.specialization,
        license_number: formData.license_number,
        hospital_clinic: formData.hospital_clinic,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('doctor_profiles')
        .upsert(payload);

      if (error) throw error;
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Error updating profile: ' + err.message);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    if (confirm('Sign out of MedVault?')) {
      await signOut();
      navigate('/login');
    }
  };

  if (loading) return <div className="page" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}><div className="spinner"></div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Doctor Profile</h1>
            <p>Update your professional credentials</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleSignOut} style={{color: 'var(--danger)', borderColor: 'var(--danger)'}}>
            <FiLogOut /> Sign Out
          </button>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '1.5rem'
            }}>
              {(profile?.full_name || 'D')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Dr. {profile?.full_name}</h2>
              <p style={{ color: 'var(--text-muted)' }}>{profile?.phone}</p>
            </div>
          </div>

          {/* Doctor ID Card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Your MedVault Doctor ID
              </p>
              <p style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.12em', fontFamily: 'monospace' }}>
                {doctorCode || <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Generating...</span>}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem', marginTop: 4 }}>
                Share this ID with patients to grant access
              </p>
            </div>
            <button
              onClick={copyDoctorCode}
              style={{
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 8, padding: '8px 12px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600,
                transition: 'background 0.2s',
              }}
              title="Copy Doctor ID"
            >
              {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>
                <FiBriefcase /> Specialization
              </label>
              <input
                className="form-input"
                placeholder="e.g. Cardiologist, General Physician"
                value={formData.specialization}
                onChange={e => setFormData({...formData, specialization: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>
                <FiAward /> Medical License Number
              </label>
              <input
                className="form-input"
                placeholder="e.g. MCI-123456"
                value={formData.license_number}
                onChange={e => setFormData({...formData, license_number: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>
                <FiMapPin /> Hospital / Clinic Name
              </label>
              <input
                className="form-input"
                placeholder="Where do you practice?"
                value={formData.hospital_clinic}
                onChange={e => setFormData({...formData, hospital_clinic: e.target.value})}
              />
            </div>

            {message && (
              <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-info'}`}>
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
