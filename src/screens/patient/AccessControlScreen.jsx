import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiUserPlus, FiTrash2, FiShield, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function AccessControlScreen() {
  const { user } = useAuth();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [granting, setGranting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    try {
      const { data, error } = await supabase
        .from('access_grants')
        .select(`
          *,
          doctor:profiles!access_grants_doctor_id_fkey(full_name, phone)
        `)
        .eq('patient_id', user.id)
        .is('revoked_at', null);

      if (data) setGrants(data);
    } catch (err) {
      console.error('Failed to fetch grants:', err);
    }
    setLoading(false);
  };

  const grantAccess = async (e) => {
    e.preventDefault();
    if (!doctorEmail.trim()) return;
    setGranting(true);
    setMessage({ type: '', text: '' });

    try {
      // Find doctor by email — look up in profiles
      const { data: doctors, error: findError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'doctor')
        .ilike('full_name', `%${doctorEmail.trim()}%`)
        .limit(1);

      if (findError) throw findError;

      if (!doctors || doctors.length === 0) {
        // Try matching by direct ID
        const { data: directDoc, error: directErr } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', doctorEmail.trim())
          .eq('role', 'doctor')
          .single();

        if (directErr || !directDoc) {
          setMessage({ type: 'error', text: 'Doctor not found. Ask them to share their ID.' });
          setGranting(false);
          return;
        }

        await insertGrant(directDoc.id);
      } else {
        await insertGrant(doctors[0].id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }

    setGranting(false);
  };

  const insertGrant = async (doctorId) => {
    // Check if already granted
    const existing = grants.find(g => g.doctor_id === doctorId);
    if (existing) {
      setMessage({ type: 'error', text: 'This doctor already has access.' });
      return;
    }

    const { data, error } = await supabase
      .from('access_grants')
      .insert({
        patient_id: user.id,
        doctor_id: doctorId,
        granted_at: new Date().toISOString(),
      })
      .select(`
        *,
        doctor:profiles!access_grants_doctor_id_fkey(full_name, phone)
      `)
      .single();

    if (error) throw error;

    setGrants(prev => [...prev, data]);
    setDoctorEmail('');
    setMessage({ type: 'success', text: 'Access granted successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const revokeAccess = async (grantId) => {
    if (!confirm('Revoke this doctor\'s access?')) return;

    try {
      const { error } = await supabase
        .from('access_grants')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', grantId);

      if (error) throw error;

      setGrants(prev => prev.filter(g => g.id !== grantId));
      setMessage({ type: 'success', text: 'Access revoked.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Access Control</h1>
          <p>Manage which doctors can view your records</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {message.text}
          </div>
        )}

        {/* Grant Access Form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiUserPlus style={{ color: 'var(--primary)' }} />
            Grant Access to a Doctor
          </h3>
          <form onSubmit={grantAccess} style={{ display: 'flex', gap: 10 }}>
            <input
              id="grant-doctor-id"
              className="form-input"
              placeholder="Doctor name or ID"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={granting || !doctorEmail.trim()}
            >
              {granting ? '...' : 'Grant'}
            </button>
          </form>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Ask your doctor for their MedVault ID or name
          </p>
        </div>

        {/* Active Grants */}
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiShield style={{ color: 'var(--accent)' }} />
          Active Access ({grants.length})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : grants.length === 0 ? (
          <div className="empty-state">
            <FiShield />
            <h3>No doctors have access</h3>
            <p>Grant access above to let a doctor view your records</p>
          </div>
        ) : (
          grants.map(grant => (
            <div key={grant.id} className="access-item">
              <div className="doctor-info">
                <div className="doctor-avatar">
                  {(grant.doctor?.full_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {grant.doctor?.full_name || 'Unknown Doctor'}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Since {new Date(grant.granted_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger)' }}
                onClick={() => revokeAccess(grant.id)}
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
