import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
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
const PrescriptionScannerScreen = lazy(() => import('./screens/patient/PrescriptionScannerScreen'));
const HealthTimelineScreen = lazy(() => import('./screens/patient/HealthTimelineScreen'));
const RemindersScreen = lazy(() => import('./screens/patient/RemindersScreen'));
const DoctorHome = lazy(() => import('./screens/doctor/DoctorHome'));
const DoctorProfileScreen = lazy(() => import('./screens/doctor/DoctorProfileScreen'));

const FastSpinner = () => (
  <div className="loading-screen" style={{ background: 'transparent' }}>
    <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)' }}></div>
  </div>
);

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading MedVault...</p>
      </div>
    );
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
      <div className="app-layout">
        <Navbar role="doctor" />
        <div className="app-content">
          <OfflineBanner />
          <Routes>
            <Route path="/doctor" element={<DoctorHome />} />
            <Route path="/doctor/profile" element={<DoctorProfileScreen />} />
            <Route path="*" element={<Navigate to="/doctor" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  // Patient routes
  return (
    <div className="app-layout">
      <Navbar role="patient" />
      <div className="app-content">
        <OfflineBanner />
        <Routes>
          <Route path="/patient" element={<PatientHome />} />
          <Route path="/patient/profile" element={<ProfileScreen />} />
          <Route path="/patient/reports" element={<ReportsScreen />} />
          <Route path="/patient/summary" element={<MedicalSummaryScreen />} />
          <Route path="/patient/qr" element={<QRScreen />} />
          <Route path="/patient/access" element={<AccessControlScreen />} />
          <Route path="/patient/chat" element={<AIChatScreen />} />
          <Route path="/patient/prescriptions" element={<PrescriptionScannerScreen />} />
          <Route path="/patient/timeline" element={<HealthTimelineScreen />} />
          <Route path="/patient/reminders" element={<RemindersScreen />} />
          <Route path="*" element={<Navigate to="/patient" replace />} />
        </Routes>
      </div>
    </div>
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
