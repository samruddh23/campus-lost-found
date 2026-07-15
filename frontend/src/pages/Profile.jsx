import { useState } from 'react';
import { User, Mail, Phone, Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Profile.css';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePwChange = e => setPwForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/profile', form);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.password !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await api.put('/profile', { password: pwForm.password });
      toast.success('Password updated!');
      setPwForm({ password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSavingPw(false); }
  };

  if (!user) return null;

  return (
    <div className="page-wrapper">
      <div className="container profile-container">
        <h1 className="section-title" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <User size={22}/> My Profile
        </h1>
        <p className="section-subtitle">Manage your account information</p>

        <div className="profile-grid">
          {/* Info card */}
          <form className="card" onSubmit={handleSave}>
            <div className="profile-card__header">
              <div className="profile-avatar">{user.name?.[0]?.toUpperCase()}</div>
              <div>
                <h2 className="font-bold">{user.name}</h2>
                <p className="text-muted text-sm">{user.email}</p>
                <span className={`badge badge-${user.role} mt-1`}>{user.role}</span>
              </div>
            </div>

            <hr className="divider" />

            <div className="form-group">
              <label className="form-label" htmlFor="prof-name"><User size={13}/> Full Name</label>
              <input id="prof-name" name="name" type="text" className="form-control" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="prof-email"><Mail size={13}/> Email</label>
              <input id="prof-email" name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="prof-phone"><Phone size={13}/> Phone</label>
              <input id="prof-phone" name="phone" type="tel" className="form-control" placeholder="Optional" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group text-xs text-muted">
              Member since: {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '—'}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={saving} id="save-profile">
              <Save size={15}/> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>

          {/* Password card */}
          <form className="card" onSubmit={handlePwSave} style={{ alignSelf:'flex-start' }}>
            <h3 className="font-bold" style={{ marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Lock size={16}/> Change Password
            </h3>
            <div className="form-group">
              <label className="form-label" htmlFor="pw-new">New Password</label>
              <input id="pw-new" name="password" type="password" className="form-control" placeholder="Min. 6 characters" value={pwForm.password} onChange={handlePwChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pw-confirm">Confirm Password</label>
              <input id="pw-confirm" name="confirm" type="password" className="form-control" placeholder="Re-enter new password" value={pwForm.confirm} onChange={handlePwChange} required />
            </div>
            <button type="submit" className="btn btn-secondary w-full" disabled={savingPw} id="save-password">
              <Lock size={15}/> {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
