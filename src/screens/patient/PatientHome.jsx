import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { offlineStore } from '../../lib/offlineStore';
import { Link } from 'react-router-dom';
import { FiFileText, FiHeart, FiMaximize, FiShield, FiUser, FiAlertTriangle, FiClock, FiCamera, FiActivity } from 'react-icons/fi';

export default function PatientHome() {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || 'Patient';
  const greeting = getGreeting();
  const [summary, setSummary] = useState(null);
  const [reportCount, setReportCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      // Fetch medical summary
      const { data: sumData } = await supabase
        .from('medical_summaries')
        .select('conditions, allergies, current_medications, blood_pressure, blood_sugar')
        .eq('patient_id', user.id)
        .single();

      if (sumData) {
        setSummary(sumData);
        await offlineStore.save(`dashboard_summary_${user.id}`, sumData);
      }

      // Fetch report count
      const { count } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('patient_id', user.id);

      setReportCount(count || 0);
    } catch {
      // Try offline
      const cached = await offlineStore.load(`dashboard_summary_${user.id}`);
      if (cached) setSummary(cached);
    }
    setLoading(false);
  };

  const conditionsCount = summary?.conditions?.length || 0;
  const allergiesCount = summary?.allergies?.length || 0;
  const medsCount = summary?.current_medications?.length || 0;

  return (
    <div className="page">
      <div className="container">
        {/* Greeting */}
        <div className="page-header" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>{greeting}</p>
          <h1 style={{ fontSize: '1.6rem' }}>
            {displayName === 'Patient' ? 'Welcome!' : `Hi, ${displayName.split(' ')[0]}!`}
          </h1>
        </div>

        {/* Profile completion reminder */}
        {(!profile?.full_name || !profile?.blood_group) && (
          <Link to="/patient/profile" style={{ textDecoration: 'none' }}>
            <div className="alert alert-info" style={{ cursor: 'pointer', marginBottom: 20 }}>
              <FiAlertTriangle />
              Complete your profile for better emergency QR codes
            </div>
          </Link>
        )}

        {/* ── FEATURE 1: Live Medical Summary Widget ── */}
        {!loading && summary && (conditionsCount + allergiesCount + medsCount > 0) && (
          <Link to="/patient/summary" style={{ textDecoration: 'none' }}>
            <div className="card summary-widget" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                borderRadius: '50%', background: 'var(--primary-glow)', opacity: 0.3, pointerEvents: 'none'
              }} />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiActivity style={{ color: 'var(--primary)' }} /> Medical Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="summary-mini-stat">
                  <span className="mini-stat-value" style={{ color: 'var(--primary)' }}>{conditionsCount}</span>
                  <span className="mini-stat-label">Conditions</span>
                </div>
                <div className="summary-mini-stat">
                  <span className="mini-stat-value" style={{ color: 'var(--danger)' }}>{allergiesCount}</span>
                  <span className="mini-stat-label">Allergies</span>
                </div>
                <div className="summary-mini-stat">
                  <span className="mini-stat-value" style={{ color: 'var(--accent)' }}>{medsCount}</span>
                  <span className="mini-stat-label">Medications</span>
                </div>
              </div>
              {(summary.blood_pressure || summary.blood_sugar) && (
                <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  {summary.blood_pressure && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      🩺 BP: <strong style={{ color: 'var(--text-primary)' }}>{summary.blood_pressure}</strong>
                    </span>
                  )}
                  {summary.blood_sugar && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      🩸 Sugar: <strong style={{ color: 'var(--text-primary)' }}>{summary.blood_sugar}</strong>
                    </span>
                  )}
                </div>
              )}
              {/* Show tags preview */}
              {summary.conditions?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                  {summary.conditions.slice(0, 3).map((c, i) => (
                    <span key={i} className="tag tag-primary" style={{ fontSize: '0.7rem' }}>{c}</span>
                  ))}
                  {summary.conditions.length > 3 && (
                    <span className="tag tag-primary" style={{ fontSize: '0.7rem', opacity: 0.7 }}>+{summary.conditions.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Quick Stats */}
        <div className="summary-grid">
          <Link to="/patient/reports" style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FiFileText style={{ color: 'var(--primary)' }} />
                <span className="stat-label">Reports</span>
              </div>
              <div className="stat-value">{loading ? '—' : reportCount}</div>
            </div>
          </Link>
          <Link to="/patient/summary" style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FiHeart style={{ color: 'var(--danger)' }} />
                <span className="stat-label">Health</span>
              </div>
              <div className="stat-value">{loading ? '—' : (conditionsCount + allergiesCount > 0 ? `${conditionsCount + allergiesCount}` : 'View')}</div>
            </div>
          </Link>
        </div>

        {/* Action Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link to="/patient/qr" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(10, 132, 255, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiMaximize style={{ color: 'var(--primary-light)', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Emergency QR Code</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Show your medical summary instantly — works offline
                </p>
              </div>
            </div>
          </Link>

          <Link to="/patient/timeline" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(168, 85, 247, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiClock style={{ color: '#C084FC', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Health Timeline</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Chronological view of your medical journey
                </p>
              </div>
            </div>
          </Link>

          <Link to="/patient/reports" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiFileText style={{ color: 'var(--accent-light)', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Upload Reports</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Store prescriptions, lab tests, X-rays securely
                </p>
              </div>
            </div>
          </Link>

          <Link to="/patient/prescriptions" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(251, 191, 36, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiCamera style={{ color: '#FBBF24', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Prescription Scanner</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Scan prescriptions to extract medicines & dosages
                </p>
              </div>
            </div>
          </Link>

          <Link to="/patient/access" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiShield style={{ color: 'var(--warning)', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Access Control</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Manage which doctors can see your records
                </p>
              </div>
            </div>
          </Link>

          <Link to="/patient/profile" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FiUser style={{ color: '#A78BFA', width: 22, height: 22 }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>My Profile</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Personal info, emergency contacts, medical details
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '☀️ Good morning';
  if (h < 17) return '🌤️ Good afternoon';
  return '🌙 Good evening';
}
