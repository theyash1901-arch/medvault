import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { offlineStore } from '../../lib/offlineStore';
import { FiSave, FiCheckCircle, FiAlertCircle, FiPlus, FiX } from 'react-icons/fi';

export default function MedicalSummaryScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    conditions: [],
    allergies: [],
    current_medications: [],
    blood_pressure: '',
    blood_sugar: '',
    notes: '',
  });
  const [newItem, setNewItem] = useState({ conditions: '', allergies: '', current_medications: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [linkedReports, setLinkedReports] = useState([]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_summaries')
        .select('*')
        .eq('patient_id', user.id)
        .single();

      if (data) {
        setFormData({
          conditions: data.conditions || [],
          allergies: data.allergies || [],
          current_medications: data.current_medications || [],
          blood_pressure: data.blood_pressure || '',
          blood_sugar: data.blood_sugar || '',
          notes: data.notes || '',
        });
        await offlineStore.save(`summary_${user.id}`, data);
      } else if (error && error.code === 'PGRST116') {
        const cached = await offlineStore.load(`summary_${user.id}`);
        if (cached) setFormData(cached);
      }
      
      // Fetch linked reports (Feature 1 requirement)
      const { data: reports } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(3);
      if (reports) setLinkedReports(reports);

    } catch {
      const cached = await offlineStore.load(`summary_${user.id}`);
      if (cached) setFormData(cached);
    }
    setFetching(false);
  };

  const addItem = (field) => {
    const val = newItem[field]?.trim();
    if (!val) return;
    if (formData[field].includes(val)) return;
    setFormData(prev => ({ ...prev, [field]: [...prev[field], val] }));
    setNewItem(prev => ({ ...prev, [field]: '' }));
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const payload = {
      patient_id: user.id,
      ...formData,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from('medical_summaries')
        .upsert(payload, { onConflict: 'patient_id' });

      if (error) throw error;

      await offlineStore.save(`summary_${user.id}`, payload);

      // Update emergency QR data
      const profile = await offlineStore.load(`profile_${user.id}`);
      await offlineStore.saveEmergencyData(profile, formData);

      setMessage({ type: 'success', text: 'Medical summary saved!' });
    } catch {
      await offlineStore.save(`summary_${user.id}`, payload);
      // Feature 6: Add to sync queue
      await offlineStore.addToSyncQueue({
        type: 'upsert_summary',
        payload: payload
      });
      setMessage({ type: 'error', text: 'Saved locally. Will sync when online.' });
    }

    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const TagInput = ({ field, label, placeholder, tagClass }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          className="form-input"
          placeholder={placeholder}
          value={newItem[field] || ''}
          onChange={(e) => setNewItem(prev => ({ ...prev, [field]: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(field))}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => addItem(field)}
          style={{ flexShrink: 0 }}
        >
          <FiPlus />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {formData[field]?.map((item, i) => (
          <span key={i} className={`tag ${tagClass}`} style={{ cursor: 'pointer' }} onClick={() => removeItem(field, i)}>
            {item} <FiX size={12} />
          </span>
        ))}
      </div>
    </div>
  );

  if (fetching) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Medical Summary</h1>
          <p>Your key health information at a glance</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Conditions */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--primary-light)' }}>
              Health Conditions
            </h3>
            <TagInput
              field="conditions"
              label="Current Conditions"
              placeholder="e.g. Diabetes Type 2"
              tagClass="tag-primary"
            />
          </div>

          {/* Allergies */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--danger)' }}>
              ⚠️ Allergies
            </h3>
            <TagInput
              field="allergies"
              label="Known Allergies"
              placeholder="e.g. Penicillin"
              tagClass="tag-danger"
            />
          </div>

          {/* Medications */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--accent-light)' }}>
              💊 Current Medications
            </h3>
            <TagInput
              field="current_medications"
              label="Medications"
              placeholder="e.g. Metformin 500mg"
              tagClass="tag-accent"
            />
          </div>

          {/* Vitals */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 16, color: 'var(--warning)' }}>
              📊 Vitals
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Blood Pressure</label>
                <input
                  id="summary-bp"
                  className="form-input"
                  placeholder="e.g. 120/80"
                  value={formData.blood_pressure}
                  onChange={(e) => setFormData(prev => ({ ...prev, blood_pressure: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Sugar</label>
                <input
                  id="summary-sugar"
                  className="form-input"
                  placeholder="e.g. 110 mg/dL"
                  value={formData.blood_sugar}
                  onChange={(e) => setFormData(prev => ({ ...prev, blood_sugar: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea
                id="summary-notes"
                className="form-input"
                placeholder="Any other important health notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                style={{ minHeight: 80 }}
              />
            </div>
          </div>

            <button
            id="summary-save"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
            ) : (
              <>
                <FiSave /> Save Summary
              </>
            )}
          </button>
        </form>

        {/* Linked Reports Display */}
        {linkedReports.length > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: 'var(--primary-light)' }}>
              📄 Linked Recent Reports
            </h3>
            {linkedReports.map(report => (
              <div key={report.id} className="report-item" style={{ margin: '0 -8px', marginBottom: 8 }}>
                <div className="report-info">
                  <h4>{report.title}</h4>
                  <p>{new Date(report.uploaded_at).toLocaleDateString('en-IN')}</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
