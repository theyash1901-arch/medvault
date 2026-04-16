import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';

// Lazy-loaded routes
const LoginScreen = lazy(() => import('./screens/auth/LoginScreen'));
const SignupScreen = lazy(() => import('./screens/auth/SignupScreen'));
const RoleSelectionScreen = lazy(() => import('./screens/auth/RoleSelectionScreen'));
const PatientHome = lazy(() => import('./screens/patient/PatientHome'));
const ProfileScreen = lazy(() => import('./screens/patient/ProfileScreen'));
const ReportsScreen = lazy(() => import('./screens/patient/ReportsScreen'));
const MedicalSummaryScreen = lazy(() => import('./screens/patient/MedicalSummaryScreen'));
const QRScreen = lazy(() => import('./screens/patient/QRScreen'));
const AccessControlScreen = lazy(() => import('./screens/patient/AccessControlScreen'));
const AIChatScreen = lazy(() => import('./screens/patient/AIChatScreen'));
const DoctorHome = lazy(() => import('./screens/doctor/DoctorHome'));
const DoctorProfileScreen = lazy(() => import('./screens/doctor/DoctorProfileScreen'));

const FastSpinner = () => (
  <div className="loading-screen" style={{ background: 'transparent' }}>
    <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)' }}></div>
  </div>
);

function SetupScreen() {
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <div className="logo-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1>MedVault</h1>
          <p>Your health records, secured.</p>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--warning)' }}>
            ⚙️ Supabase Setup Required
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            To get started, you need to create a free Supabase project and add your credentials.
          </p>
          <ol style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 2 }}>
            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener" style={{ color: 'var(--primary)' }}>supabase.com</a> and create a free project</li>
            <li>Go to <strong>Settings → API</strong> and copy your project URL and anon key</li>
            <li>Open <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>.env</code> in the project root</li>
            <li>Replace the placeholder values with your real credentials</li>
            <li>Run the SQL from <code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>supabase-schema.sql</code> in the SQL Editor</li>
            <li>Restart the dev server</li>
          </ol>
        </div>

        <div className="card" style={{ background: 'rgba(14, 165, 233, 0.05)', borderColor: 'rgba(14, 165, 233, 0.2)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--primary-light)' }}>
            📋 .env file format
          </h4>
          <pre style={{
            fontSize: '0.75rem', color: 'var(--accent-light)', background: 'var(--bg-primary)',
            padding: 12, borderRadius: 8, overflowX: 'auto', lineHeight: 1.8
          }}>
{`VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, profile, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading MedVault...</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', opacity: 0.4, marginTop: 8 }}>v2.1</p>
      </div>
    );
  }

  // Supabase not configured
  if (!isConfigured) {
    return <SetupScreen />;
  }

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but no profile/role selected
  if (!profile?.role) {
    return (
      <Routes>
        <Route path="/select-role" element={<RoleSelectionScreen />} />
        <Route path="*" element={<Navigate to="/select-role" replace />} />
      </Routes>
    );
  }

  // Doctor routes
  if (profile.role === 'doctor') {
    return (
      <>
        <OfflineBanner />
        <Routes>
          <Route path="/doctor" element={<DoctorHome />} />
          <Route path="/doctor/profile" element={<DoctorProfileScreen />} />
          <Route path="*" element={<Navigate to="/doctor" replace />} />
        </Routes>
        <BottomNav role="doctor" />
      </>
    );
  }

  // Patient routes
  return (
    <>
      <OfflineBanner />
      <Routes>
        <Route path="/patient" element={<PatientHome />} />
        <Route path="/patient/profile" element={<ProfileScreen />} />
        <Route path="/patient/reports" element={<ReportsScreen />} />
        <Route path="/patient/summary" element={<MedicalSummaryScreen />} />
        <Route path="/patient/qr" element={<QRScreen />} />
        <Route path="/patient/access" element={<AccessControlScreen />} />
        <Route path="/patient/chat" element={<AIChatScreen />} />
        <Route path="*" element={<Navigate to="/patient" replace />} />
      </Routes>
      <BottomNav role="patient" />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<FastSpinner />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
