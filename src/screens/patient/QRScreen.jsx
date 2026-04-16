import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { offlineStore } from '../../lib/offlineStore';
import QRCode from 'qrcode';
import { FiMaximize, FiRefreshCw, FiInfo } from 'react-icons/fi';

export default function QRScreen() {
  const { user, profile } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [emergencyData, setEmergencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const canvasRef = useRef();

  useEffect(() => {
    generateQR();
  }, [profile]);

  const generateQR = async () => {
    setLoading(true);

    // Load emergency data (works offline)
    let data = await offlineStore.getEmergencyData();

    // If no cached data, build from profile
    if (!data && profile) {
      const summary = await offlineStore.load(`summary_${user.id}`);
      data = await offlineStore.saveEmergencyData(profile, summary);
    }

    if (!data) {
      data = {
        name: profile?.full_name || 'Unknown',
        blood_group: profile?.blood_group || '--',
        conditions: [],
        allergies: [],
        medications: [],
        emergency_contact: profile?.emergency_contact_name || '',
        emergency_phone: profile?.emergency_contact_phone || '',
      };
    }

    setEmergencyData(data);

    // Generate QR code with minimal data for quick scanning
    const qrPayload = JSON.stringify({
      _t: 'medvault',
      n: data.name,
      bg: data.blood_group,
      c: data.conditions?.slice(0, 5) || [],
      a: data.allergies?.slice(0, 5) || [],
      m: data.medications?.slice(0, 5) || [],
      ec: data.emergency_contact,
      ep: data.emergency_phone,
      g: data.gender || '',
    });

    try {
      const url = await QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('QR generation failed:', err);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Generating QR code...</p>
        </div>
      </div>
    );
  }

  // Fullscreen QR view
  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'white',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, cursor: 'pointer'
        }}
        onClick={() => setFullscreen(false)}
      >
        {qrDataUrl && <img src={qrDataUrl} alt="Emergency QR" style={{ width: '80vmin', height: '80vmin' }} />}
        <p style={{ color: '#333', marginTop: 16, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
          {emergencyData?.name} • {emergencyData?.blood_group}
        </p>
        <p style={{ color: '#666', fontSize: '0.8rem', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
          Tap anywhere to close
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Emergency QR</h1>
          <p>Show this to first responders in an emergency</p>
        </div>

        {/* QR Code Display */}
        <div className="qr-container">
          <div className="qr-wrapper" onClick={() => setFullscreen(true)} style={{ cursor: 'pointer' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Emergency QR Code" style={{ width: 240, height: 240 }} />
            ) : (
              <div style={{ width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#999' }}>Unable to generate QR</p>
              </div>
            )}
          </div>

          <div className="qr-info">
            <h3>{emergencyData?.name}</h3>
            <p>Blood Group: <strong style={{ color: 'var(--danger)' }}>{emergencyData?.blood_group || '--'}</strong></p>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => setFullscreen(true)}>
              <FiMaximize size={14} /> Fullscreen
            </button>
            <button className="btn btn-outline" onClick={generateQR}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Emergency Data Preview */}
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FiInfo style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>QR Contains</h3>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <InfoRow label="Name" value={emergencyData?.name} />
            <InfoRow label="Blood Group" value={emergencyData?.blood_group} />
            <InfoRow label="Emergency Contact" value={
              emergencyData?.emergency_contact
                ? `${emergencyData.emergency_contact} (${emergencyData.emergency_phone || 'No phone'})`
                : 'Not set'
            } />

            {emergencyData?.conditions?.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conditions</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {emergencyData.conditions.map((c, i) => (
                    <span key={i} className="tag tag-primary">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {emergencyData?.allergies?.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allergies</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {emergencyData.allergies.map((a, i) => (
                    <span key={i} className="tag tag-danger">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {emergencyData?.medications?.length > 0 && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Medications</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {emergencyData.medications.map((m, i) => (
                    <span key={i} className="tag tag-accent">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="alert alert-info" style={{ marginTop: 16 }}>
          <FiInfo size={14} />
          <span style={{ fontSize: '0.8rem' }}>This QR code works offline. Data is stored on your device.</span>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
      <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{value || '--'}</p>
    </div>
  );
}
