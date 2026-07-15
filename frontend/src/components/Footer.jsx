import { Link } from 'react-router-dom';
import { MapPin, Heart } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__logo"><MapPin size={16} /></div>
          <span>Campus<strong>Find</strong></span>
        </div>

        <nav className="footer__nav">
          <Link to="/browse">Browse</Link>
          <Link to="/report/lost">Report Lost</Link>
          <Link to="/report/found">Report Found</Link>
          <Link to="/login">Log in</Link>
        </nav>

        <p className="footer__copy">
          Made with <Heart size={12} className="footer__heart" /> for campus communities · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
