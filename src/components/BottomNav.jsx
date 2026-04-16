import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiFileText, FiHeart, FiMaximize, FiUser, FiLogOut, FiSearch } from 'react-icons/fi';

export default function BottomNav({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    if (confirm('Sign out of MedVault?')) {
      await signOut();
      navigate('/login');
    }
  };

  if (role === 'doctor') {
    return (
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <NavItem
            icon={<FiHome />}
            label="Home"
            active={location.pathname === '/doctor'}
            onClick={() => navigate('/doctor')}
          />
          <NavItem
            icon={<FiLogOut />}
            label="Sign Out"
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
          icon={<FiHeart />}
          label="Health"
          active={location.pathname === '/patient/summary'}
          onClick={() => navigate('/patient/summary')}
        />
        <NavItem
          icon={<FiUser />}
          label="Profile"
          active={location.pathname === '/patient/profile'}
          onClick={() => navigate('/patient/profile')}
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
