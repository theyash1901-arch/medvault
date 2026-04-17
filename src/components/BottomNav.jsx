import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiFileText, FiHeart, FiMaximize, FiUser, FiLogOut, FiSearch, FiMessageCircle } from 'react-icons/fi';

export default function BottomNav({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    if (confirm('Sign out of MedVault?')) {
      await signOut();
      navigate('/');
    }
  };

  if (role === 'doctor') {
    return (
      <nav className="bottom-nav">
        <div className="bottom-nav-inner" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <NavItem
            icon={<FiHome />}
            label="Dashboard"
            active={location.pathname === '/doctor'}
            onClick={() => navigate('/doctor')}
          />
          <NavItem
            icon={<FiUser />}
            label="Profile"
            active={location.pathname === '/doctor/profile'}
            onClick={() => navigate('/doctor/profile')}
          />
          <NavItem
            icon={<FiLogOut />}
            label="Logout"
            active={false}
            onClick={handleSignOut}
          />
        </div>
      </nav>
    );
  }

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <NavItem
          icon={<FiHome />}
          label="Home"
          active={location.pathname === '/patient'}
          onClick={() => navigate('/patient')}
        />
        <NavItem
          icon={<FiFileText />}
          label="Reports"
          active={location.pathname === '/patient/reports'}
          onClick={() => navigate('/patient/reports')}
        />
        <NavItem
          icon={<FiMaximize />}
          label="QR"
          active={location.pathname === '/patient/qr'}
          onClick={() => navigate('/patient/qr')}
        />
        <NavItem
          icon={<FiMessageCircle />}
          label="AI Chat"
          active={location.pathname === '/patient/chat'}
          onClick={() => navigate('/patient/chat')}
        />
        <NavItem
          icon={<FiUser />}
          label="Profile"
          active={location.pathname === '/patient/profile'}
          onClick={() => navigate('/patient/profile')}
        />
        <NavItem
          icon={<FiLogOut />}
          label="Logout"
          active={false}
          onClick={handleSignOut}
        />
      </div>
    </nav>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
