import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { FiSearch, FiMaximize, FiUser, FiFileText, FiAlertTriangle, FiHeart } from 'react-icons/fi';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function DoctorHome() {
  const { profile } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [patientReports, setPatientReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const displayName = profile?.full_name || 'Doctor';

  useEffect(() => {
    if (!scanning) return;

    try {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (text) => {
          scanner.clear();
          setScanning(false);
          handleQRScan(text);
        },
        (err) => {
          // ignore background scan errors 
        }
      );

      return () => {
        try {
          scanner.clear();
        } catch (e) {
          console.error(e);
        }
      };
    } catch (err) {
      console.error("Scanner failed:", err);
      setError("Could not load camera scanner. Check camera permissions.");
      setScanning(false);
    }
  }, [scanning]);

  const searchPatient = async (e) => {
    e?.preventDefault();
    if (!searchId.trim()) return;
    setLoading(true);
    setError('');
    setPatientData(null);
    setPatientReports([]);
    setScannedData(null);

    try {
      // Check if doctor has access to this patient
      const { data: grants } = await supabase
        .from('access_grants')
        .select('patient_id')
        .eq('doctor_id', profile.id)
        .is('revoked_at', null);

      const grantedIds = grants?.map(g => g.patient_id) || [];

      // Search by name or ID
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient');

      // Try UUID first, then name search
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

      // Fetch patient data
      const [summaryRes, reportsRes] = await Promise.all([
        supabase.from('medical_summaries').select('*').eq('patient_id', patient.id).single(),
        supabase.from('reports').select('*').eq('patient_id', patient.id).order('uploaded_at', { ascending: false }),
      ]);

      setPatientData({
        ...patient,
        summary: summaryRes.data,
      });
      setPatientReports(reportsRes.data || []);
    } catch (err) {
      setError('Search failed: ' + err.message);
    }

    setLoading(false);
  };

  // Handle QR scan result
  const handleQRScan = (text) => {
    try {
      const data = JSON.parse(text);
      if (data._t !== 'medvault') {
        setError('Invalid MedVault QR code');
        return;
      }
      setScannedData(data);
      setScanning(false);
    } catch {
      setError('Could not read QR code');
    }
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
        <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
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
              <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', overflow: 'hidden', borderRadius: '12px' }}></div>
              <button 
                className="btn btn-outline btn-sm" 
                style={{ marginTop: 12 }}
                onClick={() => setScanning(false)}
              >
                Cancel Scan
              </button>
            </div>
          )}
        </div>

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
            {/* Patient Info */}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <DataRow label="Phone" value={patientData.phone} />
                <DataRow label="Emergency Contact" value={patientData.emergency_contact_name} />
              </div>
            </div>

            {/* Medical Summary */}
            {patientData.summary && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiHeart style={{ color: 'var(--danger)' }} />
                  Medical Summary
                </h3>

                <div style={{ display: 'grid', gap: 12 }}>
                  {patientData.summary.conditions?.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conditions</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {patientData.summary.conditions.map((c, i) => <span key={i} className="tag tag-primary">{c}</span>)}
                      </div>
                    </div>
                  )}
                  {patientData.summary.allergies?.length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allergies</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {patientData.summary.allergies.map((a, i) => <span key={i} className="tag tag-danger">{a}</span>)}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <DataRow label="Blood Pressure" value={patientData.summary.blood_pressure} />
                    <DataRow label="Blood Sugar" value={patientData.summary.blood_sugar} />
                  </div>
                </div>
              </div>
            )}

            {/* Reports */}
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
