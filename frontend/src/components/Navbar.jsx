import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, Menu, X, MapPin, LogOut, User, LayoutDashboard,
  PlusCircle, ClipboardList, ChevronDown
} from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__brand">
          <div className="navbar__logo">
            <MapPin size={18} />
          </div>
          <span className="navbar__brand-text">Campus<span>Find</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar__links">
          <Link to="/browse" className={`navbar__link ${location.pathname === '/browse' ? 'active' : ''}`}>Browse</Link>
          {user && (
            <>
              <Link to="/report/lost" className={`navbar__link ${location.pathname === '/report/lost' ? 'active' : ''}`}>Report Lost</Link>
              <Link to="/report/found" className={`navbar__link ${location.pathname === '/report/found' ? 'active' : ''}`}>Report Found</Link>
              <Link to="/my-reports" className={`navbar__link ${location.pathname === '/my-reports' ? 'active' : ''}`}>My Reports</Link>
              {isAdmin && (
                <Link to="/admin" className={`navbar__link navbar__link--admin ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                  <LayoutDashboard size={14} /> Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* Desktop Auth */}
        <div className="navbar__auth">
          {user ? (
            <div className="navbar__user" onClick={() => setDropOpen(!dropOpen)}>
              <div className="navbar__avatar">{user.name?.[0]?.toUpperCase()}</div>
              <span className="navbar__username">{user.name.split(' ')[0]}</span>
              <ChevronDown size={14} className={dropOpen ? 'rotated' : ''} />
              {dropOpen && (
                <div className="navbar__dropdown">
                  <Link to="/profile" className="navbar__drop-item"><User size={14}/> Profile</Link>
                  <Link to="/my-reports" className="navbar__drop-item"><ClipboardList size={14}/> My Reports</Link>
                  {isAdmin && <Link to="/admin" className="navbar__drop-item"><LayoutDashboard size={14}/> Admin Panel</Link>}
                  <hr className="navbar__drop-divider"/>
                  <button className="navbar__drop-item navbar__drop-item--danger" onClick={handleLogout}>
                    <LogOut size={14}/> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="navbar__toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar__mobile">
          <Link to="/browse" className="navbar__mobile-link">Browse Items</Link>
          {user ? (
            <>
              <Link to="/report/lost" className="navbar__mobile-link">Report Lost Item</Link>
              <Link to="/report/found" className="navbar__mobile-link">Report Found Item</Link>
              <Link to="/my-reports" className="navbar__mobile-link">My Reports</Link>
              <Link to="/profile" className="navbar__mobile-link">Profile</Link>
              {isAdmin && <Link to="/admin" className="navbar__mobile-link">Admin Panel</Link>}
              <button className="navbar__mobile-link navbar__mobile-link--danger" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__mobile-link">Log in</Link>
              <Link to="/register" className="navbar__mobile-link">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
