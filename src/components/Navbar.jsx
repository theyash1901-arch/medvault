import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/analyze', label: 'Analyze' },
    { path: '/match', label: 'Job Match' },
    { path: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <nav ref={navRef} className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <Sparkles size={24} />
          </div>
          <span className="navbar-brand-text">
            Talent<span className="text-gradient">Lens</span> AI
          </span>
        </Link>

        <div className={`navbar-links ${isMobileOpen ? 'navbar-links-open' : ''}`}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'navbar-link-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/analyze" className="btn btn-primary btn-sm navbar-cta">
            Get Started
          </Link>
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle navigation"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
