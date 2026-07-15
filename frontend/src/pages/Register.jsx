import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/register', { name: form.name, email: form.email, password: form.password, phone: form.phone || undefined });
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-wrapper">
      <div className="container auth-container">
        <div className="auth-card card animate-slide-up">
          <div className="auth-card__header">
            <div className="auth-logo"><MapPin size={20} /></div>
            <h1 className="auth-card__title">Create account</h1>
            <p className="auth-card__sub">Join CampusFind and start reporting items</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input id="reg-name" name="name" type="text" className="form-control" placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email address</label>
              <input id="reg-email" name="email" type="email" className="form-control" placeholder="you@campus.edu" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Phone (optional)</label>
              <input id="reg-phone" name="phone" type="tel" className="form-control" placeholder="+91 9876543210" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className="auth-pw-wrap">
                <input id="reg-password" name="password" type={showPw ? 'text' : 'password'} className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} required />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" name="confirm" type="password" className="form-control" placeholder="Re-enter password" value={form.confirm} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading} id="register-submit">
              {loading ? 'Creating account…' : <><UserPlus size={16}/> Create Account</>}
            </button>
          </form>

          <p className="auth-card__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
