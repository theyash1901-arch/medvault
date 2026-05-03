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
    <div className="container">
      <div className="page-header flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-slate-500 mt-1">{reports.length} report{reports.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <button
          id="btn-upload"
          className="btn btn-primary"
          onClick={() => setShowUpload(true)}
        >
          <FiUpload size={16} /> Upload
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline bg-white'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {REPORT_TYPES.map(type => (
          <button
            key={type.value}
            className={`btn btn-sm whitespace-nowrap ${filter === type.value ? 'btn-primary' : 'btn-outline bg-white'}`}
            onClick={() => setFilter(type.value)}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4 md:p-0" onClick={() => setShowUpload(false)}>
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Upload Report</h2>
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div className="form-group mb-0">
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

              <div className="form-group mb-0">
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

              <div className="form-group mb-0">
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer bg-slate-50 transition-colors hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center gap-2"
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadData.file ? (
                    <>
                      <FiFileText size={32} className="text-blue-500" />
                      <p className="text-slate-900 font-medium mt-2">
                        {uploadData.file.name}
                      </p>
                      <p className="text-xs text-slate-500">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <FiImage size={32} className="text-slate-400" />
                      <p className="text-slate-700 font-medium mt-2">Tap to select file</p>
                      <p className="text-xs text-slate-500">PDF, JPG, PNG (max 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files[0] }))}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </button>
                <button
                  id="upload-submit"
                  type="submit"
                  className="btn btn-primary flex-[2]"
                  disabled={uploading || analyzing || !uploadData.file}
                >
                  {uploading && !analyzing && (
                    <span className="flex items-center gap-2">
                      <span className="spinner w-4 h-4 border-2"></span> Uploading...
                    </span>
                  )}
                  {analyzing && (
                    <span className="flex items-center gap-2">
                      <span className="spinner w-4 h-4 border-2"></span> Analyzing Report...
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
        <div className="text-center py-10">
          <div className="spinner mx-auto"></div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 px-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <FiFileText size={28} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No reports yet</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">Upload your medical reports to keep them safe and accessible</p>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
            <FiUpload size={16} /> Upload First Report
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredReports.map(report => (
            <div key={report.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4 mb-0 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-2xl shadow-inner border border-slate-200">
                  {getTypeIcon(report.report_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 truncate mb-1">{report.title}</h4>
                  <p className="text-xs text-slate-500">
                    {new Date(report.uploaded_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0 justify-end mt-2 sm:mt-0">
                {report.file_url && (
                  <a
                    href={report.file_url}
                    target="_blank"
                    rel="noopener"
                    className="btn btn-outline btn-sm bg-white"
                  >
                    <FiDownload size={16} /> View
                  </a>
                )}
                <button
                  className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 hover:border-red-200"
                  onClick={() => deleteReport(report)}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
