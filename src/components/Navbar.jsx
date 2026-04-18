import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiFileText, FiHeart, FiMaximize, FiUser, FiSearch, FiMessageCircle, FiLogOut } from 'react-icons/fi';

export default function Navbar({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    if (confirm('Sign out of MedVault?')) {
      await signOut();
      navigate('/login');
    }
  };

  const patientLinks = [
    { path: '/patient', icon: <FiHome />, label: 'Dashboard' },
    { path: '/patient/reports', icon: <FiFileText />, label: 'Reports' },
    { path: '/patient/qr', icon: <FiMaximize />, label: 'Emergency QR' },
    { path: '/patient/chat', icon: <FiMessageCircle />, label: 'AI Chat' },
  ];

  const doctorLinks = [
    { path: '/doctor', icon: <FiHome />, label: 'Dashboard' },
  ];

  const links = role === 'doctor' ? doctorLinks : patientLinks;
  const profilePath = role === 'doctor' ? '/doctor/profile' : '/patient/profile';

  return (
    <nav className="top-navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate(role === 'doctor' ? '/doctor' : '/patient')}>
          <span className="brand-icon">⚕️</span>
          <span className="brand-text">MedVault</span>
        </div>

        <div className="navbar-links">
          {links.map(link => (
            <button
              key={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              {link.icon} <span>{link.label}</span>
            </button>
          ))}
        </div>

        <div className="navbar-actions">
          <button
            className={`nav-link ${location.pathname === profilePath ? 'active' : ''}`}
            onClick={() => navigate(profilePath)}
            title="Profile"
          >
            <FiUser />
          </button>
          <button className="nav-link text-danger" onClick={handleSignOut} title="Sign Out">
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>
  );
}
