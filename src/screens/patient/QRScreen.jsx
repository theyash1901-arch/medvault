import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { offlineStore } from '../../lib/offlineStore';
import QRCode from 'qrcode';
import { Scanner } from '@yudiel/react-qr-scanner';
import { FiMaximize, FiRefreshCw, FiInfo, FiCamera, FiX } from 'react-icons/fi';

export default function QRScreen() {
  const { user, profile } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [emergencyData, setEmergencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState('');
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

  const handleQRScan = (result) => {
    if (!result || !result.length) return;
    try {
      const data = JSON.parse(result[0].rawValue);
      if (data._t !== 'medvault') {
        setError('Invalid MedVault QR code');
        return;
      }
      setScannedData(data);
      setIsScanning(false);
      setError('');
    } catch {
      setError('Could not parse QR code data.');
    }
  };

  if (loading) {
    return (
      <div className="container text-center pt-16">
        <div className="spinner mx-auto"></div>
        <p className="text-slate-500 mt-3 text-sm">Generating QR code...</p>
      </div>
    );
  }

  // Fullscreen QR view
  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 cursor-pointer p-6"
        onClick={() => setFullscreen(false)}
      >
        {qrDataUrl && <img src={qrDataUrl} alt="Emergency QR" className="w-[80vmin] h-[80vmin] max-w-lg max-h-lg object-contain shadow-sm border border-slate-200 rounded-3xl" />}
        <p className="text-slate-900 mt-6 font-bold text-xl tracking-tight">
          {emergencyData?.name} • <span className="text-red-600">{emergencyData?.blood_group}</span>
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Tap anywhere to close
        </p>
      </div>
    );
  }

  return (
    <div className="container pb-24">
      <div className="page-header flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Emergency QR</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Show or scan a code in an emergency</p>
        </div>
        <button
          className={`btn btn-sm ${isScanning ? 'btn-outline bg-white' : 'btn-accent shadow-sm'}`}
          onClick={() => { setIsScanning(!isScanning); setScannedData(null); setError(''); }}
        >
          {isScanning ? <FiX size={14} /> : <FiCamera size={14} />}
          {isScanning ? ' Cancel Scan' : ' Scan QR'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <FiInfo size={16} className="shrink-0" /> 
          <span>{error}</span>
        </div>
      )}

      {/* Scan Mode UI */}
      {isScanning && !scannedData && (
        <div className="card text-center mb-6 border-emerald-200 bg-emerald-50/30">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Scan Patient's QR Code
          </h3>
          <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl shadow-inner border border-slate-200 bg-black">
            <Scanner onScan={handleQRScan} />
          </div>
          <p className="text-sm text-slate-500 mt-4 max-w-xs mx-auto">
            Place the MedVault QR code inside the frame to view emergency info.
          </p>
        </div>
      )}

      {/* Scanned Data View */}
      {scannedData && (
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 mb-6">
          <div className="card border-red-200 bg-red-50/40">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                🚨 Emergency Info
              </h3>
              <button
                className="btn btn-ghost btn-sm text-slate-500 hover:bg-slate-200/50"
                onClick={() => setScannedData(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <InfoRow label="Name" value={scannedData.n} />
              <div className="bg-red-100/50 p-4 rounded-xl border border-red-200/50">
                <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Blood Group</span>
                <p className="text-2xl font-black text-red-600 mt-0.5">{scannedData.bg || '--'}</p>
              </div>
              <InfoRow label="Gender" value={scannedData.g} />
              <InfoRow label="Emergency Contact" value={`${scannedData.ec} (${scannedData.ep})`} />

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
        </div>
      )}

      {/* My QR Mode UI (Only show if not scanning and not viewing scan result) */}
      {!isScanning && !scannedData && (
        <div className="animate-in fade-in duration-300">
          <div className="card flex flex-col items-center p-8 bg-gradient-to-b from-white to-slate-50/50 border-slate-200 shadow-sm">
            <div 
              className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow mb-6 group"
              onClick={() => setFullscreen(true)} 
            >
              {qrDataUrl ? (
                <div className="relative">
                  <img src={qrDataUrl} alt="Emergency QR Code" className="w-56 h-56 sm:w-64 sm:h-64 object-contain" />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm text-slate-700">
                      <FiMaximize size={20} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-slate-400 text-sm font-medium">Unable to generate QR</p>
                </div>
              )}
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{emergencyData?.name}</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Blood Group: <strong className="text-red-500 font-bold ml-1">{emergencyData?.blood_group || '--'}</strong>
              </p>
            </div>

            <div className="flex gap-3 justify-center w-full max-w-xs">
              <button className="btn btn-primary flex-1" onClick={() => setFullscreen(true)}>
                <FiMaximize size={16} /> Fullscreen
              </button>
              <button className="btn btn-outline flex-1 bg-white" onClick={generateQR}>
                <FiRefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>

          <div className="card mt-6 border-slate-200">
            <div className="flex items-center gap-2 mb-5">
              <FiInfo className="text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-800">My QR Contains</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Name" value={emergencyData?.name} />
              <InfoRow label="Blood Group" value={emergencyData?.blood_group} />
              <div className="sm:col-span-2">
                <InfoRow label="Emergency Contact" value={
                  emergencyData?.emergency_contact
                    ? `${emergencyData.emergency_contact} (${emergencyData.emergency_phone || 'No phone'})`
                    : 'Not set'
                } />
              </div>

              {emergencyData?.conditions?.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 font-medium">Conditions</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {emergencyData.conditions.map((c, i) => (
                      <span key={i} className="tag tag-primary">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {emergencyData?.allergies?.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 font-medium">Allergies</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {emergencyData.allergies.map((a, i) => (
                      <span key={i} className="tag tag-danger">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {emergencyData?.medications?.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-500 font-medium">Medications</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {emergencyData.medications.map((m, i) => (
                      <span key={i} className="tag tag-accent">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="alert bg-blue-50/50 border border-blue-100 text-blue-700 mt-6">
            <FiInfo size={16} className="shrink-0" />
            <span className="text-xs font-medium">This QR code works offline. Data is stored securely on your device.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <p className="text-sm font-semibold text-slate-900 mt-0.5">{value || '--'}</p>
    </div>
  );
}
