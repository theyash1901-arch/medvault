import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiUser, FiBriefcase, FiAward, FiMapPin, FiSave, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function DoctorProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    specialization: '',
    license_number: '',
    hospital_clinic: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

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
