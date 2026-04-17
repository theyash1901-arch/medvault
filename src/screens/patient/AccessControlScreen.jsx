import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiUserPlus, FiTrash2, FiShield, FiCheckCircle, FiAlertCircle, FiClock, FiEye, FiList } from 'react-icons/fi';

export default function AccessControlScreen() {
  const { user } = useAuth();
  const [grants, setGrants] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [granting, setGranting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expiresIn, setExpiresIn] = useState('permanent');
  const [showLogs, setShowLogs] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

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

      if (data) {
        // Filter out expired grants on client side for display
        const activeGrants = data.filter(g => !g.expires_at || new Date(g.expires_at) > new Date());
        setGrants(activeGrants);
      }
    } catch (err) {
      console.error('Failed to fetch grants:', err);
    }
    setLoading(false);
  };

  const fetchAccessLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from('access_logs')
        .select(`
          *,
          doctor:profiles!access_logs_doctor_id_fkey(full_name)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setAccessLogs(data);
    } catch (err) {
      console.error('Failed to fetch access logs:', err);
    }
    setLogsLoading(false);
  };

  const toggleLogs = () => {
    if (!showLogs && accessLogs.length === 0) {
      fetchAccessLogs();
    }
    setShowLogs(!showLogs);
  };

  const getExpiryDate = () => {
    if (expiresIn === 'permanent') return null;
    const now = new Date();
    switch (expiresIn) {
      case '1h': return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      case '6h': return new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
      case '24h': return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      default: return null;
    }
  };

  const getExpiryLabel = (expiresAt) => {
    if (!expiresAt) return 'Permanent';
    const exp = new Date(expiresAt);
    const now = new Date();
    const diff = exp.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h left`;
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m left`;
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

    const expiresAt = getExpiryDate();

    const { data, error } = await supabase
      .from('access_grants')
      .insert({
        patient_id: user.id,
        doctor_id: doctorId,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select(`
        *,
        doctor:profiles!access_grants_doctor_id_fkey(full_name, phone)
      `)
      .single();

    if (error) throw error;

    setGrants(prev => [...prev, data]);
    setDoctorEmail('');
    const expiryText = expiresAt ? ` (expires: ${getExpiryLabel(expiresAt)})` : ' (permanent)';
    setMessage({ type: 'success', text: `Access granted successfully!${expiryText}` });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
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

  const formatLogTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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
          <form onSubmit={grantAccess}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
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
            </div>

            {/* Time-based access selector */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiClock size={12} /> Access Duration
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { value: 'permanent', label: 'Permanent' },
                  { value: '1h', label: '1 Hour' },
                  { value: '6h', label: '6 Hours' },
                  { value: '24h', label: '24 Hours' },
                  { value: '7d', label: '7 Days' },
                  { value: '30d', label: '30 Days' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn btn-sm ${expiresIn === opt.value ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setExpiresIn(opt.value)}
                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Ask your doctor for their MedVault ID or name
          </p>
        </div>

        {/* Active Grants */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiShield style={{ color: 'var(--accent)' }} />
            Active Access ({grants.length})
          </h3>
          <button
            className={`btn btn-sm ${showLogs ? 'btn-primary' : 'btn-outline'}`}
            onClick={toggleLogs}
            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
          >
            <FiList size={12} /> {showLogs ? 'Hide Logs' : 'View Logs'}
          </button>
        </div>

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
                  {grant.expires_at && (
                    <p style={{
                      fontSize: '0.7rem',
                      color: new Date(grant.expires_at) > new Date() ? 'var(--warning)' : 'var(--danger)',
                      display: 'flex', alignItems: 'center', gap: 4, marginTop: 2
                    }}>
                      <FiClock size={10} />
                      {getExpiryLabel(grant.expires_at)}
                    </p>
                  )}
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

        {/* Access Logs Section */}
        {showLogs && (
          <div style={{ marginTop: 24, animation: 'slideUp 0.3s ease' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiEye style={{ color: 'var(--primary)' }} />
              Access Logs
            </h3>

            {logsLoading ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : accessLogs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No access logs yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {accessLogs.map(log => (
                  <div key={log.id} className="card" style={{ padding: '12px 16px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                          Dr. {log.doctor?.full_name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {log.action === 'view_summary' && '👁️ Viewed medical summary'}
                          {log.action === 'view_reports' && '📄 Viewed reports'}
                          {log.action === 'view_profile' && '👤 Viewed profile'}
                          {log.action === 'view' && `👁️ ${log.details || 'Viewed records'}`}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatLogTime(log.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
