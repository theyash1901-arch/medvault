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
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{greeting}</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {displayName === 'Patient' ? 'Welcome back' : `${displayName}`}
        </h1>
      </div>

      {(!profile?.full_name || !profile?.blood_group) && (
        <div className="alert alert-warning" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fef3c7' }}>
          <FiAlertTriangle />
          <span>Complete your profile for better emergency QR codes. <Link to="/patient/profile" style={{ color: '#b45309', textDecoration: 'underline' }}>Fix now</Link></span>
        </div>
      )}

      {/* Top: Medical Summary */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Medical Summary</h2>
          <Link to="/patient/summary" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>View All</Link>
        </div>
        
        {loading ? (
           <div className="card text-center"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : summary && (conditionsCount + allergiesCount + medsCount > 0) ? (
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{conditionsCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conditions</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{allergiesCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allergies</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{medsCount}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Medications</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '32px 20px' }}>
            <FiActivity size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>No Medical History</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Upload a report to automatically extract your health summary.</p>
            <Link to="/patient/reports" className="btn btn-primary btn-sm"><FiFileText /> Upload Report</Link>
          </div>
        )}
      </div>

      {/* Middle: Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          <DashboardAction icon={<FiMaximize />} title="Emergency QR" link="/patient/qr" color="#3b82f6" />
          <DashboardAction icon={<FiClock />} title="Timeline" link="/patient/timeline" color="#8b5cf6" />
          <DashboardAction icon={<FiCamera />} title="Scan Rx" link="/patient/prescriptions" color="#10b981" />
          <DashboardAction icon={<FiBell />} title="Reminders" link="/patient/reminders" color="#f59e0b" />
          <DashboardAction icon={<FiShield />} title="Access" link="/patient/access" color="#64748b" />
          <DashboardAction icon={<FiUser />} title="Profile" link="/patient/profile" color="#ec4899" />
        </div>
      </div>

      {/* Bottom: Recent Reports */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Reports</h2>
          <Link to="/patient/reports" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>View All ({reportCount})</Link>
        </div>

        {recentReports.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentReports.map(report => (
              <div key={report.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <FiFileText style={{ color: 'var(--primary)', fontSize: '1.2rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 4 }}>{report.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(report.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {report.report_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '32px 20px', background: 'transparent', borderStyle: 'dashed' }}>
             <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No reports uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardAction({ icon, title, link, color }) {
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ padding: '16px', textAlign: 'center', height: '100%', marginBottom: 0, transition: 'var(--transition)' }} 
           onMouseOver={e => e.currentTarget.style.borderColor = color}
           onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
        <div style={{ 
          width: 40, height: 40, margin: '0 auto 12px', borderRadius: '10px',
          background: `${color}15`, color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
        }}>
          {icon}
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</div>
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
