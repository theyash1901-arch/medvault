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
    <div className="container">
      <div className="page-header mb-8">
        <p className="text-sm text-slate-500 font-medium mb-1">
          🩺 Doctor Dashboard
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Welcome, Dr. {displayName.split(' ').pop()}</h1>
      </div>

      {/* Search Patient */}
      <div className="card mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FiSearch className="text-blue-600" />
          Find Patient
        </h3>
        <form onSubmit={searchPatient} className="flex gap-3">
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
      <div className="card mb-6 text-center">
        <h3 className="text-base font-semibold text-slate-800 mb-2">Quick Emergency Access</h3>
        <p className="text-sm text-slate-500 mb-5">
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
          <div className="relative">
            <div className="w-full max-w-sm mx-auto overflow-hidden rounded-xl shadow-inner border border-slate-200">
              <Scanner onScan={handleQRScan} />
            </div>
            <button 
              className="btn btn-outline btn-sm mt-4" 
              onClick={() => setScanning(false)}
            >
              Cancel Scan
            </button>
          </div>
        )}
      </div>

        {/* Granted Patients List */}
        {!patientData && !scannedData && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FiShield className="text-emerald-600" />
              Your Patients ({grantedPatients.length})
            </h3>
            {loadingPatients ? (
              <div className="text-center py-6">
                <div className="spinner mx-auto"></div>
              </div>
            ) : grantedPatients.length === 0 ? (
              <div className="card text-center p-8 border-dashed">
                <p className="text-sm text-slate-500">
                  No patients have granted you access yet
                </p>
              </div>
            ) : (
              grantedPatients.map(grant => (
                <div
                  key={grant.patient_id}
                  className="card p-4 mb-3 flex items-center gap-4 cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => viewPatientById(grant.patient_id)}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {(grant.patient?.full_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                      {grant.patient?.full_name || 'Unknown'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {grant.patient?.blood_group && `${grant.patient.blood_group} • `}
                      {grant.patient?.gender || ''}
                      {grant.expires_at && ` • ⏰ ${getExpiryLabel(grant.expires_at)}`}
                    </p>
                  </div>
                  <FiUser className="text-slate-400 shrink-0" />
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
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="card mb-6 border-red-200 bg-red-50/30">
              <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                🚨 Emergency Patient Info
              </h3>

              <div className="flex flex-col gap-4">
                <DataRow label="Name" value={scannedData.n} />
                <DataRow label="Blood Group" value={scannedData.bg} highlight />
                <DataRow label="Gender" value={scannedData.g} />
                <DataRow label="Emergency Contact" value={`${scannedData.ec} (${scannedData.ep})`} />

                {scannedData.c?.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Conditions</span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {scannedData.c.map((c, i) => <span key={i} className="tag tag-primary">{c}</span>)}
                    </div>
                  </div>
                )}

                {scannedData.a?.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 font-medium">⚠️ Allergies</span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {scannedData.a.map((a, i) => <span key={i} className="tag tag-danger">{a}</span>)}
                    </div>
                  </div>
                )}

                {scannedData.m?.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Medications</span>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {scannedData.m.map((m, i) => <span key={i} className="tag tag-accent">{m}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="btn btn-outline btn-full bg-white" onClick={() => setScannedData(null)}>
              Clear
            </button>
          </div>
        )}

        {/* Full Patient View (when searched with access) */}
        {patientData && (
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            {/* Patient Info Header */}
            <div className="card mb-4 border-slate-200">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {(patientData.full_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{patientData.full_name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {patientData.gender} • {patientData.blood_group} • {patientData.date_of_birth}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DataRow label="Phone" value={patientData.phone} />
                <DataRow label="Emergency Contact" value={patientData.emergency_contact_name} />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
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
              <div className="card mb-4 border-slate-200">
                <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <FiHeart className="text-red-500" />
                  Medical Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-5">
                    {patientData.summary.conditions?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conditions</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {patientData.summary.conditions.map((c, i) => <span key={i} className="tag tag-primary">{c}</span>)}
                        </div>
                      </div>
                    )}
                    {patientData.summary.allergies?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">⚠️ Allergies</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {patientData.summary.allergies.map((a, i) => <span key={i} className="tag tag-danger">{a}</span>)}
                        </div>
                      </div>
                    )}
                    {patientData.summary.current_medications?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">💊 Medications</span>
                        <div className="flex flex-col gap-2 mt-2">
                          {patientData.summary.current_medications.map((m, i) => (
                            <div key={i} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <DataRow label="Blood Pressure" value={patientData.summary.blood_pressure} />
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <DataRow label="Blood Sugar" value={patientData.summary.blood_sugar} />
                      </div>
                    </div>
                    {patientData.summary.notes && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
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
              <div className="card mb-4 border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FiFileText className="text-blue-600" />
                  Reports ({patientReports.length})
                </h3>

                {patientReports.length === 0 ? (
                  <p className="text-sm text-slate-500">No reports uploaded</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {patientReports.map(report => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{report.title}</h4>
                          <p className="text-xs text-slate-500">{new Date(report.uploaded_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}</p>
                        </div>
                        {report.file_url && (
                          <a href={report.file_url} target="_blank" rel="noopener" className="btn btn-outline btn-sm bg-white">
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="card mb-4 border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FiClock className="text-purple-500" />
                  Health Timeline
                </h3>

                {patientTimeline.length === 0 ? (
                  <p className="text-sm text-slate-500">No timeline events</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {patientTimeline.map(event => (
                      <div key={event.id} className="p-3 bg-slate-50 rounded-xl border-l-4 border-l-purple-500 shadow-sm">
                        <p className="text-xs font-medium text-slate-400 mb-1">
                          {new Date(event.event_date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                        <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-slate-500 mt-1">
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
              className="btn btn-outline w-full mt-4 bg-white"
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
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <p className={`text-sm mt-0.5 ${highlight ? 'font-bold text-red-600' : 'font-semibold text-slate-800'}`}>
        {value || '--'}
      </p>
    </div>
  );
}
