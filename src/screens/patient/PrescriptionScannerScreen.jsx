import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { askMedicalAI } from '../../lib/gemini';
import { FiCamera, FiUpload, FiCheckCircle, FiAlertCircle, FiTrash2, FiSave, FiImage } from 'react-icons/fi';

const SAMPLE_PROMPT = `You are a medical prescription OCR assistant. Analyze this prescription image and extract medicine information.

Return ONLY a valid JSON array (no markdown, no explanation) with objects having these fields:
- "name": medicine name (string)
- "dosage": dosage amount like "500mg" (string)
- "frequency": how often to take like "twice daily" (string)  
- "duration": how long like "7 days" (string)
- "notes": any special instructions (string)

If you cannot identify medicines, return an empty array [].
Example output: [{"name":"Paracetamol","dosage":"500mg","frequency":"Twice daily","duration":"5 days","notes":"After meals"}]`;

export default function PrescriptionScannerScreen() {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [savedPrescriptions, setSavedPrescriptions] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const fileRef = useRef();

  // Load saved prescriptions on mount
  useState(() => {
    loadSavedPrescriptions();
  }, []);

  const loadSavedPrescriptions = async () => {
    try {
      const { data } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user.id)
        .order('scanned_at', { ascending: false });
      if (data) setSavedPrescriptions(data);
    } catch {
      // Table might not exist yet
    }
    setLoadingSaved(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image too large. Max 10MB.' });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setMedicines([]);
    setMessage({ type: '', text: '' });
  };

  const scanPrescription = async () => {
    if (!selectedImage) return;
    setScanning(true);
    setMessage({ type: '', text: '' });
    setMedicines([]);

    try {
      // Convert image to base64
      const base64 = imagePreview.split(',')[1];
      const mimeType = selectedImage.type || 'image/jpeg';

      // Use Gemini with vision to extract medicines
      const { GoogleGenAI } = await import('@google/genai');
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: SAMPLE_PROMPT },
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
      });

      const text = response.text || '';

      // Parse JSON from response
      let parsed = [];
      try {
        // Try direct parse
        parsed = JSON.parse(text.trim());
      } catch {
        // Try to extract JSON array from response
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        setMedicines(parsed);
        setMessage({ type: 'success', text: `Found ${parsed.length} medicine(s)!` });
      } else {
        setMessage({ type: 'error', text: 'Could not identify medicines. Try a clearer image.' });
      }
    } catch (err) {
      console.error('Scan error:', err);
      setMessage({ type: 'error', text: 'Scan failed: ' + err.message });
    }

    setScanning(false);
  };

  const savePrescription = async () => {
    if (medicines.length === 0) return;
    setSaving(true);

    try {
      // Upload image to storage
      let imageUrl = '';
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}/prescriptions/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('reports')
          .upload(fileName, selectedImage);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('reports')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      // Save to prescriptions table
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: user.id,
          image_url: imageUrl,
          medicines: medicines,
          raw_text: JSON.stringify(medicines),
          scanned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Also add timeline event
      try {
        await supabase.from('health_events').insert({
          patient_id: user.id,
          event_type: 'prescription',
          title: `Prescription scanned — ${medicines.length} medicine(s)`,
          description: medicines.map(m => `${m.name} ${m.dosage}`).join(', '),
          event_date: new Date().toISOString().split('T')[0],
          metadata: { prescription_id: data.id },
        });
      } catch {
        // Timeline event is optional
      }

      setSavedPrescriptions(prev => [data, ...prev]);
      setMessage({ type: 'success', text: 'Prescription saved!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    }

    setSaving(false);
  };

  const deletePrescription = async (id) => {
    if (!confirm('Delete this prescription?')) return;
    try {
      await supabase.from('prescriptions').delete().eq('id', id);
      setSavedPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const clearScan = () => {
    setSelectedImage(null);
    setImagePreview('');
    setMedicines([]);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Prescription Scanner</h1>
          <p>Upload a prescription to extract medicine details</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {message.text}
          </div>
        )}

        {/* Upload Area */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCamera style={{ color: 'var(--primary)' }} /> Scan Prescription
          </h3>

          {!imagePreview ? (
            <div
              className="upload-zone"
              onClick={() => fileRef.current?.click()}
              style={{ cursor: 'pointer', padding: '40px 20px' }}
            >
              <FiImage size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontWeight: 500 }}>Tap to upload prescription image</p>
              <p className="upload-hint">JPG, PNG (max 10MB)</p>
            </div>
          ) : (
            <div>
              <div style={{
                position: 'relative', borderRadius: 'var(--radius-md)',
                overflow: 'hidden', marginBottom: 16, border: '1px solid var(--border)'
              }}>
                <img
                  src={imagePreview}
                  alt="Prescription"
                  style={{ width: '100%', maxHeight: 300, objectFit: 'contain', background: '#111' }}
                />
                <button
                  className="btn btn-sm"
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 10px'
                  }}
                  onClick={clearScan}
                >
                  <FiTrash2 size={14} /> Clear
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-primary btn-full"
                  onClick={scanPrescription}
                  disabled={scanning}
                >
                  {scanning ? (
                    <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Analyzing...</>
                  ) : (
                    <><FiCamera size={14} /> Extract Medicines</>
                  )}
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
        </div>

        {/* Extracted Medicines */}
        {medicines.length > 0 && (
          <div className="card" style={{ marginBottom: 20, animation: 'slideUp 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                💊 Extracted Medicines ({medicines.length})
              </h3>
              <button
                className="btn btn-accent btn-sm"
                onClick={savePrescription}
                disabled={saving}
                style={{ padding: '6px 14px' }}
              >
                {saving ? '...' : <><FiSave size={12} /> Save</>}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {medicines.map((med, idx) => (
                <div key={idx} className="medicine-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {med.name}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        {med.dosage && <span className="tag tag-primary">{med.dosage}</span>}
                        {med.frequency && <span className="tag tag-accent">{med.frequency}</span>}
                        {med.duration && <span className="tag" style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.2)' }}>{med.duration}</span>}
                      </div>
                      {med.notes && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          📝 {med.notes}
                        </p>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                      background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 6, flexShrink: 0
                    }}>
                      #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Prescriptions */}
        {savedPrescriptions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>
              📋 Saved Prescriptions
            </h3>
            {savedPrescriptions.map(rx => (
              <div key={rx.id} className="card" style={{ marginBottom: 10, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {new Date(rx.scanned_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(Array.isArray(rx.medicines) ? rx.medicines : []).map((m, i) => (
                        <span key={i} className="tag tag-primary" style={{ fontSize: '0.7rem' }}>
                          {m.name} {m.dosage}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)', padding: 4 }}
                    onClick={() => deletePrescription(rx.id)}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
