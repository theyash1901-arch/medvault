import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiSearch, FiMaximize, FiUser, FiFileText, FiAlertTriangle, FiHeart, FiClock, FiShield } from 'react-icons/fi';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function DoctorHome() {
  const { profile } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [patientReports, setPatientReports] = useState([]);
  const [patientTimeline, setPatientTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [grantedPatients, setGrantedPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const displayName = profile?.full_name || 'Doctor';

  useEffect(() => {
    fetchGrantedPatients();
  }, []);

  const fetchGrantedPatients = async () => {
    try {
      const { data } = await supabase
        .from('access_grants')
        .select(`
          patient_id,
          granted_at,
          expires_at,
          patient:profiles!access_grants_patient_id_fkey(full_name, blood_group, gender)
        `)
        .eq('doctor_id', profile.id)
        .is('revoked_at', null);

      if (data) {
        // Filter out expired
        const active = data.filter(g => !g.expires_at || new Date(g.expires_at) > new Date());
        setGrantedPatients(active);
      }
    } catch (err) {
      console.error('Failed to fetch granted patients:', err);
    }
    setLoadingPatients(false);
  };

  const logAccess = async (patientId, action, details = '') => {
    try {
      await supabase.from('access_logs').insert({
        patient_id: patientId,
        doctor_id: profile.id,
        action,
        details,
      });
    } catch {
      // Access logging is best-effort
    }
  };

  const searchPatient = async (e) => {
    e?.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    setError('');
    setPatientData(null);
    setPatientReports([]);
    setPatientTimeline([]);
    setScannedData(null);
    setActiveTab('summary');

    try {
      // Check if doctor has access to this patient
      const { data: grants } = await supabase
        .from('access_grants')
        .select('patient_id, expires_at')
        .eq('doctor_id', profile.id)
        .is('revoked_at', null);

      const validGrants = (grants || []).filter(g => !g.expires_at || new Date(g.expires_at) > new Date());
      const grantedIds = validGrants.map(g => g.patient_id);

      // Search by name or ID
      let patients;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', searchId.trim())
          .eq('role', 'patient')
          .single();
        patients = data ? [data] : [];
      } catch {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'patient')
          .ilike('full_name', `%${searchId.trim()}%`)
          .limit(5);
        patients = data || [];
      }

      if (patients.length === 0) {
        setError('No patient found with that name or ID.');
        setLoading(false);
        return;
      }

      const patient = patients[0];
      const hasAccess = grantedIds.includes(patient.id);

      if (!hasAccess) {
        setError(`You don't have access to this patient's records. Ask them to grant you access via their Access Control page.`);
        setLoading(false);
        return;
      }

      // Log the access
      await logAccess(patient.id, 'view', 'Searched and viewed patient records');

      // Fetch all patient data in parallel
      const [summaryRes, reportsRes, timelineRes] = await Promise.all([
        supabase.from('medical_summaries').select('*').eq('patient_id', patient.id).single(),
        supabase.from('reports').select('*').eq('patient_id', patient.id).order('uploaded_at', { ascending: false }),
        supabase.from('health_events').select('*').eq('patient_id', patient.id).order('event_date', { ascending: false }).limit(20),
      ]);

      setPatientData({
        ...patient,
        summary: summaryRes.data,
      });
      setPatientReports(reportsRes.data || []);
      setPatientTimeline(timelineRes.data || []);
    } catch (err) {
      setError('Search failed: ' + err.message);
    }

    setLoading(false);
  };

  const viewPatientById = async (patientId) => {
    setSearchId(patientId);
    setLoading(true);
    setError('');
    setPatientData(null);
    setPatientReports([]);
    setPatientTimeline([]);
    setScannedData(null);
    setActiveTab('summary');

    try {
      await logAccess(patientId, 'view', 'Viewed from patient list');

      const [profileRes, summaryRes, reportsRes, timelineRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', patientId).single(),
        supabase.from('medical_summaries').select('*').eq('patient_id', patientId).single(),
        supabase.from('reports').select('*').eq('patient_id', patientId).order('uploaded_at', { ascending: false }),
        supabase.from('health_events').select('*').eq('patient_id', patientId).order('event_date', { ascending: false }).limit(20),
      ]);

      if (profileRes.data) {
        setPatientData({ ...profileRes.data, summary: summaryRes.data });
        setPatientReports(reportsRes.data || []);
        setPatientTimeline(timelineRes.data || []);
      } else {
        setError('Patient not found.');
      }
    } catch (err) {
      setError('Failed to load patient: ' + err.message);
    }
    setLoading(false);
  };

  // Handle QR scan result
  const handleQRScan = (result) => {
    if (!result || !result.length) return;
    try {
      const data = JSON.parse(result[0].rawValue);
      if (data._t !== 'medvault') {
        setError('Invalid MedVault QR code');
        return;
      }
      setScannedData(data);
      setScanning(false);
    } catch {
      setError('Could not parse QR code data.');
    }
  };

  const getExpiryLabel = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d left`;
    return `${hours}h left`;
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            🩺 Doctor Dashboard
          </p>
          <h1>Welcome, Dr. {displayName.split(' ').pop()}</h1>
        </div>

        {/* Search Patient */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiSearch style={{ color: 'var(--primary)' }} />
            Find Patient
          </h3>
          <form onSubmit={searchPatient} style={{ display: 'flex', gap: 10 }}>
            <input
              id="search-patient"
              className="form-input"
              placeholder="Patient name or ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? '...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Scan QR Button */}
        <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Quick Emergency Access</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Scan a patient's emergency QR code to view critical info instantly
          </p>
          
          {!scanning ? (
            <button
              id="btn-scan-qr"
              className="btn btn-accent btn-lg"
              onClick={() => setScanning(true)}
            >
              <FiMaximize size={16} /> Open Camera Scanner
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', overflow: 'hidden', borderRadius: '12px' }}>
                <Scanner onScan={handleQRScan} />
              </div>
              <button 
                className="btn btn-outline btn-sm" 
                style={{ marginTop: 16 }}
                onClick={() => setScanning(false)}
              >
                Cancel Scan
              </button>
            </div>
          )}
        </div>

        {/* Granted Patients List */}
        {!patientData && !scannedData && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiShield style={{ color: 'var(--accent)' }} />
              Your Patients ({grantedPatients.length})
            </h3>
            {loadingPatients ? (
              <div style={{ textAlign: 'center', paddingTop: 20 }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : grantedPatients.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 24 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No patients have granted you access yet
                </p>
              </div>
            ) : (
              grantedPatients.map(grant => (
                <div
                  key={grant.patient_id}
                  className="card"
                  style={{ padding: '14px 18px', marginBottom: 8, cursor: 'pointer' }}
                  onClick={() => viewPatientById(grant.patient_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0
                    }}>
                      {(grant.patient?.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {grant.patient?.full_name || 'Unknown'}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {grant.patient?.blood_group && `${grant.patient.blood_group} • `}
                        {grant.patient?.gender || ''}
                        {grant.expires_at && ` • ⏰ ${getExpiryLabel(grant.expires_at)}`}
                      </p>
                    </div>
                    <FiUser style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <FiAlertTriangle />
            {error}
          </div>
        )}

        {/* Scanned QR Emergency View */}
        {scannedData && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="card" style={{
              marginBottom: 16,
              borderColor: 'var(--danger)',
              background: 'rgba(239, 68, 68, 0.05)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 16 }}>
                🚨 Emergency Patient Info
              </h3>

              <div style={{ display: 'grid', gap: 14 }}>
                <DataRow label="Name" value={scannedData.n} />
                <DataRow label="Blood Group" value={scannedData.bg} highlight />
                <DataRow label="Gender" value={scannedData.g} />
                <DataRow label="Emergency Contact" value={`${scannedData.ec} (${scannedData.ep})`} />

                {scannedData.c?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conditions</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {scannedData.c.map((c, i) => <span key={i} className="tag tag-primary">{c}</span>)}
                    </div>
                  </div>
                )}

                {scannedData.a?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⚠️ Allergies</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {scannedData.a.map((a, i) => <span key={i} className="tag tag-danger">{a}</span>)}
                    </div>
                  </div>
                )}

                {scannedData.m?.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Medications</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {scannedData.m.map((m, i) => <span key={i} className="tag tag-accent">{m}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="btn btn-outline btn-full" onClick={() => setScannedData(null)}>
              Clear
            </button>
          </div>
        )}

        {/* Full Patient View (when searched with access) */}
        {patientData && (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            {/* Patient Info Header */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 50, height: 50, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '1.2rem'
                }}>
                  {(patientData.full_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{patientData.full_name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {patientData.gender} • {patientData.blood_group} • {patientData.date_of_birth}
                  </p>
                </div>
              </div>

              <div className="grid-desktop-only" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <DataRow label="Phone" value={patientData.phone} />
                <DataRow label="Emergency Contact" value={patientData.emergency_contact_name} />
              </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
              {[
                { key: 'summary', label: 'Summary', icon: <FiHeart size={14} /> },
                { key: 'reports', label: `Reports (${patientReports.length})`, icon: <FiFileText size={14} /> },
                { key: 'timeline', label: 'Timeline', icon: <FiClock size={14} /> },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'summary' && patientData.summary && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiHeart style={{ color: 'var(--danger)' }} />
                  Medical Summary
                </h3>

                <div className="grid-desktop-only" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {patientData.summary.conditions?.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conditions</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {patientData.summary.conditions.map((c, i) => <span key={i} className="tag tag-primary">{c}</span>)}
                        </div>
                      </div>
                    )}
                    {patientData.summary.allergies?.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ Allergies</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {patientData.summary.allergies.map((a, i) => <span key={i} className="tag tag-danger">{a}</span>)}
                        </div>
                      </div>
                    )}
                    {patientData.summary.current_medications?.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💊 Medications</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                          {patientData.summary.current_medications.map((m, i) => (
                            <div key={i} style={{
                              padding: '10px 14px', background: 'var(--bg-primary)',
                              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                              fontSize: '0.9rem', fontWeight: 500
                            }}>
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <DataRow label="Blood Pressure" value={patientData.summary.blood_pressure} />
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <DataRow label="Blood Sugar" value={patientData.summary.blood_sugar} />
                      </div>
                    </div>
                    {patientData.summary.notes && (
                      <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <DataRow label="Notes" value={patientData.summary.notes} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'summary' && !patientData.summary && (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <p style={{ color: 'var(--text-muted)' }}>No medical summary available</p>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="card">
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiFileText style={{ color: 'var(--primary)' }} />
                  Reports ({patientReports.length})
                </h3>

                {patientReports.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No reports uploaded</p>
                ) : (
                  patientReports.map(report => (
                    <div key={report.id} className="report-item" style={{ margin: '0 -8px', marginBottom: 8 }}>
                      <div className="report-info">
                        <h4>{report.title}</h4>
                        <p>{new Date(report.uploaded_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}</p>
                      </div>
                      {report.file_url && (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener"
                          className="btn btn-outline btn-sm"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="card">
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiClock style={{ color: '#C084FC' }} />
                  Health Timeline
                </h3>

                {patientTimeline.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No timeline events</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {patientTimeline.map(event => (
                      <div key={event.id} style={{
                        padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-sm)', borderLeft: `3px solid var(--primary)`
                      }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                          {new Date(event.event_date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{event.title}</h4>
                        {event.description && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-outline btn-full"
              style={{ marginTop: 16 }}
              onClick={() => { setPatientData(null); setSearchId(''); }}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DataRow({ label, value, highlight }) {
  return (
    <div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
      <p style={{
        fontSize: '0.9rem',
        fontWeight: highlight ? 700 : 500,
        color: highlight ? 'var(--danger)' : 'var(--text-primary)'
      }}>
        {value || '--'}
      </p>
    </div>
  );
}
