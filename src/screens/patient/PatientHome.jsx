import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { offlineStore } from '../../lib/offlineStore';
import { Link } from 'react-router-dom';
import { FiFileText, FiHeart, FiMaximize, FiShield, FiUser, FiAlertTriangle, FiClock, FiCamera, FiActivity, FiBell } from 'react-icons/fi';

export default function PatientHome() {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || 'Patient';
  const greeting = getGreeting();
  const [recentReports, setRecentReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      const { data: sumData } = await supabase
        .from('medical_summaries')
        .select('conditions, allergies, current_medications, blood_pressure, blood_sugar')
        .eq('patient_id', user.id)
        .single();

      if (sumData) {
        setSummary(sumData);
        await offlineStore.save(`dashboard_summary_${user.id}`, sumData);
      }

      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', user.id);
      setReportCount(count || 0);

      // Fetch recent reports
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(3);
      if (reportsData) setRecentReports(reportsData);

    } catch {
      const cached = await offlineStore.load(`dashboard_summary_${user.id}`);
      if (cached) setSummary(cached);
      
      const cachedReports = await offlineStore.load(`reports_${user.id}`);
      if (cachedReports) setRecentReports(cachedReports.slice(0, 3));
    }
    setLoading(false);
  };

  const conditionsCount = summary?.conditions?.length || 0;
  const allergiesCount = summary?.allergies?.length || 0;
  const medsCount = summary?.current_medications?.length || 0;

  return (
    <div className="container">
      <div className="page-header">
        <p className="text-sm text-slate-500 font-medium mb-1">{greeting}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          {displayName === 'Patient' ? 'Welcome back' : `${displayName}`}
        </h1>
      </div>

      {(!profile?.full_name || !profile?.blood_group) && (
        <div className="alert bg-amber-50 border border-amber-200 text-amber-800">
          <FiAlertTriangle className="text-amber-600" />
          <span>Complete your profile for better emergency QR codes. <Link to="/patient/profile" className="font-semibold underline hover:text-amber-900">Fix now</Link></span>
        </div>
      )}

      {/* Top: Medical Summary */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Medical Summary</h2>
          <Link to="/patient/summary" className="btn btn-ghost btn-sm text-blue-600">View All</Link>
        </div>
        
        {loading ? (
           <div className="card text-center py-8"><div className="spinner mx-auto"></div></div>
        ) : summary && (conditionsCount + allergiesCount + medsCount > 0) ? (
          <div className="card border-l-4 border-l-blue-600 p-6">
            <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-200">
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-slate-800 mb-1">{conditionsCount}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold">Conditions</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-slate-800 mb-1">{allergiesCount}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold">Allergies</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-slate-800 mb-1">{medsCount}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-semibold">Medications</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-10 px-6 bg-slate-50/50 border-dashed border-slate-300 shadow-none">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <FiActivity size={28} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Medical History</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">Upload a report to automatically extract your health summary.</p>
            <Link to="/patient/reports" className="btn btn-primary"><FiFileText /> Upload Report</Link>
          </div>
        )}
      </div>

      {/* Middle: Quick Actions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 tracking-tight mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          <DashboardAction icon={<FiMaximize />} title="Emergency QR" link="/patient/qr" color="text-blue-600" bg="bg-blue-50" border="hover:border-blue-300" />
          <DashboardAction icon={<FiClock />} title="Timeline" link="/patient/timeline" color="text-purple-600" bg="bg-purple-50" border="hover:border-purple-300" />
          <DashboardAction icon={<FiCamera />} title="Scan Rx" link="/patient/prescriptions" color="text-emerald-600" bg="bg-emerald-50" border="hover:border-emerald-300" />
          <DashboardAction icon={<FiBell />} title="Reminders" link="/patient/reminders" color="text-amber-500" bg="bg-amber-50" border="hover:border-amber-300" />
          <DashboardAction icon={<FiShield />} title="Access" link="/patient/access" color="text-indigo-600" bg="bg-indigo-50" border="hover:border-indigo-300" />
          <DashboardAction icon={<FiUser />} title="Profile" link="/patient/profile" color="text-pink-600" bg="bg-pink-50" border="hover:border-pink-300" />
        </div>
      </div>

      {/* Bottom: Recent Reports */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Recent Reports</h2>
          <Link to="/patient/reports" className="btn btn-ghost btn-sm text-blue-600">View All ({reportCount})</Link>
        </div>

        {recentReports.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentReports.map(report => (
              <div key={report.id} className="card p-4 flex items-center gap-4 mb-0 hover:bg-slate-50 transition-colors cursor-pointer border-slate-200">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <FiFileText className="text-blue-600 text-xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 truncate mb-1">{report.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span>{new Date(report.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="capitalize">{report.report_type.replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8 bg-transparent border-dashed border-slate-300 shadow-none">
             <p className="text-sm text-slate-500">No reports uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardAction({ icon, title, link, color, bg, border }) {
  return (
    <Link to={link} className="block outline-none group">
      <div className={`card p-4 text-center h-full mb-0 transition-all duration-200 ${border} group-hover:shadow-md flex flex-col items-center justify-center`}>
        <div className={`w-10 h-10 mb-3 rounded-xl flex items-center justify-center text-xl ${bg} ${color}`}>
          {icon}
        </div>
        <div className="text-xs font-semibold text-slate-700 tracking-tight">{title}</div>
      </div>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '☀️ Good morning';
  if (h < 17) return '🌤️ Good afternoon';
  return '🌙 Good evening';
}
