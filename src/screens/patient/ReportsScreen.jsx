import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { offlineStore } from '../../lib/offlineStore';
import { FiUpload, FiFileText, FiImage, FiTrash2, FiDownload, FiFilter } from 'react-icons/fi';
import { analyzeMedicalReport } from '../../lib/gemini';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
};

const REPORT_TYPES = [
  { value: 'blood_test', label: 'Blood Test', icon: '🩸' },
  { value: 'xray', label: 'X-Ray / Scan', icon: '📷' },
  { value: 'prescription', label: 'Prescription', icon: '💊' },
  { value: 'other', label: 'Other', icon: '📄' },
];

export default function ReportsScreen() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState('all');
  const [uploadData, setUploadData] = useState({ title: '', report_type: 'other', file: null });
  const fileRef = useRef();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (data) {
        setReports(data);
        await offlineStore.save(`reports_${user.id}`, data);
      } else if (error) {
        const cached = await offlineStore.load(`reports_${user.id}`);
        if (cached) setReports(cached);
      }
    } catch {
      const cached = await offlineStore.load(`reports_${user.id}`);
      if (cached) setReports(cached);
    }
    setLoading(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title) return;
    setUploading(true);

    try {
      const fileExt = uploadData.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      let publicUrl = '';
      let reportObj = null;

      // Try Upload to Supabase Storage
      try {
        const { error: uploadError } = await supabase.storage
          .from('reports')
          .upload(fileName, uploadData.file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
        }
      } catch (uploadFail) {
        console.warn('Storage upload failed, continuing locally', uploadFail);
      }

      // Try Save metadata
      try {
        const { data: dbReport, error: dbError } = await supabase
          .from('reports')
          .insert({
            patient_id: user.id,
            title: uploadData.title,
            report_type: uploadData.report_type,
            file_url: publicUrl,
            file_name: uploadData.file.name,
            uploaded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!dbError) reportObj = dbReport;
      } catch (dbFail) {
        console.warn('DB insert failed, continuing locally', dbFail);
      }

      // If backend failed, mock report object
      if (!reportObj) {
        const { base64, mimeType } = await fileToBase64(uploadData.file);
        publicUrl = `data:${mimeType};base64,${base64}`;
        reportObj = {
          id: 'local-' + Date.now(),
          patient_id: user.id,
          title: uploadData.title,
          report_type: uploadData.report_type,
          file_url: publicUrl,
          file_name: uploadData.file.name,
          uploaded_at: new Date().toISOString(),
        };
      }

      const updatedReports = [reportObj, ...reports];
      setReports(updatedReports);
      await offlineStore.save(`reports_${user.id}`, updatedReports);

      // Perform AI Analysis automatically
      setAnalyzing(true);
      try {
        const { base64, mimeType } = await fileToBase64(uploadData.file);
        const aiData = await analyzeMedicalReport(base64, mimeType);
        
        // Fetch current summary to merge
        let curSummary = null;
        try {
          const { data } = await supabase.from('medical_summaries').select('*').eq('patient_id', user.id).single();
          curSummary = data;
        } catch (e) {
          curSummary = await offlineStore.load(`dashboard_summary_${user.id}`);
        }
          
        const newConditions = [...new Set([...(curSummary?.conditions || []), ...(aiData.conditions || [])])];
        const newAllergies = [...new Set([...(curSummary?.allergies || []), ...(aiData.allergies || [])])];
        const newMeds = [...new Set([...(curSummary?.current_medications || []), ...(aiData.current_medications || [])])];
        
        const mergedSummary = {
          patient_id: user.id,
          conditions: newConditions,
          allergies: newAllergies,
          current_medications: newMeds,
          updated_at: new Date().toISOString()
        };

        try {
          await supabase.from('medical_summaries').upsert(mergedSummary, { onConflict: 'patient_id' });
        } catch (e) {
          console.warn('Upsert failed, saving locally');
        }
        
        await offlineStore.save(`dashboard_summary_${user.id}`, mergedSummary);
        if (profile) {
          await offlineStore.saveEmergencyData(profile, mergedSummary);
        }
      } catch (aiErr) {
        console.error("AI Analysis failed:", aiErr);
      }
      setAnalyzing(false);

      setShowUpload(false);
      setUploadData({ title: '', report_type: 'other', file: null });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }

    setUploading(false);
  };

  const deleteReport = async (report) => {
    if (!confirm('Delete this report?')) return;

    try {
      await supabase.from('reports').delete().eq('id', report.id);
      const filePath = report.file_url?.split('/reports/')[1];
      if (filePath) {
        await supabase.storage.from('reports').remove([filePath]);
      }
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.report_type === filter);

  const getTypeIcon = (type) => {
    const t = REPORT_TYPES.find(rt => rt.value === type);
    return t?.icon || '📄';
  };

  const getTypeClass = (type) => {
    switch (type) {
      case 'blood_test': return 'blood';
      case 'xray': return 'xray';
      case 'prescription': return 'prescription';
      default: return 'other';
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Reports</h1>
            <p>{reports.length} report{reports.length !== 1 ? 's' : ''} uploaded</p>
          </div>
          <button
            id="btn-upload"
            className="btn btn-primary btn-sm"
            onClick={() => setShowUpload(true)}
          >
            <FiUpload size={14} /> Upload
          </button>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {REPORT_TYPES.map(type => (
            <button
              key={type.value}
              className={`btn btn-sm ${filter === type.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(type.value)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="modal-overlay" onClick={() => setShowUpload(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Upload Report</h2>
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label className="form-label">Report Title</label>
                  <input
                    id="upload-title"
                    className="form-input"
                    placeholder="e.g. Blood Test - March 2026"
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Report Type</label>
                  <select
                    id="upload-type"
                    className="form-select"
                    value={uploadData.report_type}
                    onChange={(e) => setUploadData(prev => ({ ...prev, report_type: e.target.value }))}
                  >
                    {REPORT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <div
                    className="upload-zone"
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploadData.file ? (
                      <>
                        <FiFileText size={32} style={{ color: 'var(--accent)' }} />
                        <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {uploadData.file.name}
                        </p>
                        <p className="upload-hint">Click to change file</p>
                      </>
                    ) : (
                      <>
                        <FiImage size={32} />
                        <p>Tap to select file</p>
                        <p className="upload-hint">PDF, JPG, PNG (max 5MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files[0] }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-full"
                    onClick={() => setShowUpload(false)}
                  >
                    Cancel
                  </button>
                  <button
                    id="upload-submit"
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={uploading || analyzing || !uploadData.file}
                  >
                    {uploading && !analyzing && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Uploading...
                      </span>
                    )}
                    {analyzing && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Analyzing Report...
                      </span>
                    )}
                    {!uploading && !analyzing && 'Upload & Analyze'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reports List */}
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <FiFileText />
            <h3>No reports yet</h3>
            <p>Upload your medical reports to keep them safe and accessible</p>
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
              <FiUpload size={14} /> Upload First Report
            </button>
          </div>
        ) : (
          filteredReports.map(report => (
            <div key={report.id} className="report-item">
              <div className={`report-icon ${getTypeClass(report.report_type)}`}>
                <span style={{ fontSize: '1.2rem' }}>{getTypeIcon(report.report_type)}</span>
              </div>
              <div className="report-info">
                <h4>{report.title}</h4>
                <p>{new Date(report.uploaded_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {report.file_url && (
                  <a
                    href={report.file_url}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 8 }}
                  >
                    <FiDownload size={16} />
                  </a>
                )}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 8, color: 'var(--danger)' }}
                  onClick={() => deleteReport(report)}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
