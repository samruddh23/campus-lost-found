import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import ImageUpload from '../components/ImageUpload';
import './ReportForm.css';

const CATEGORIES = ['Electronics', 'Clothing', 'Accessories', 'Books', 'Keys', 'Wallet', 'Bag', 'ID/Card', 'Other'];

export default function ReportLost() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');

  const [form, setForm] = useState({
    item_name: '', category: '', description: '', location: '', date_lost: '', status: 'lost'
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Load existing data if editing
  useEffect(() => {
    if (editId) {
      api.get(`/lost/${editId}`).then(r => {
        const d = r.data;
        setForm({
          item_name: d.item_name || '',
          category: d.category || '',
          description: d.description || '',
          location: d.location || '',
          date_lost: d.date_lost ? d.date_lost.slice(0, 10) : '',
          status: d.status || 'lost',
        });
      }).catch(() => toast.error('Could not load item'));
    }
  }, [editId]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAIParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/parse', { text: aiText });
      setForm(f => ({
        ...f,
        item_name: data.item_name || f.item_name,
        category: data.category || f.category,
        location: data.location || f.location,
        date_lost: data.date ? data.date.slice(0, 10) : f.date_lost,
      }));
      toast.success('Fields filled from your description!');
    } catch { toast.error('AI parse failed'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append('image', image);

      if (editId) {
        await api.put(`/lost/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Report updated!');
      } else {
        const { data } = await api.post('/lost', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Lost item reported!');
        navigate(`/items/lost/${data.item.id}`);
        return;
      }
      navigate('/my-reports');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper report-page">
      <div className="container report-container">
        <div className="report-header">
          <div className="report-header__icon report-header__icon--lost">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h1>{editId ? 'Edit Lost Report' : 'Report a Lost Item'}</h1>
            <p className="text-muted text-sm">Fill in the details to help others identify your item</p>
          </div>
        </div>

        {/* AI Parse */}
        {!editId && (
          <div className="ai-parse-box card">
            <div className="ai-parse-box__header">
              <Sparkles size={16} className="text-primary" />
              <span>AI Quick Fill</span>
              <span className="badge badge-found" style={{ fontSize:'0.65rem' }}>Beta</span>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom:'0.75rem' }}>
              Describe your lost item in plain text and our AI will fill the form for you.
            </p>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <textarea
                className="form-control"
                placeholder='e.g. "Lost my black Realme phone near the library on Monday"'
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                style={{ minHeight:'64px', resize:'none' }}
                id="ai-parse-input"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAIParse}
                disabled={aiLoading || !aiText.trim()}
                id="ai-parse-btn"
                style={{ flexShrink:0, alignSelf:'flex-end' }}
              >
                {aiLoading ? '…' : <><Sparkles size={14}/> Parse</>}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="report-form card">
          <div className="report-form__grid">
            <div>
              <div className="form-group">
                <label className="form-label" htmlFor="item_name">Item Name *</label>
                <input id="item_name" name="item_name" type="text" className="form-control" placeholder="e.g. iPhone 14, Black Wallet…" value={form.item_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="category">Category *</label>
                <select id="category" name="category" className="form-control" value={form.category} onChange={handleChange} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="location">Location *</label>
                <input id="location" name="location" type="text" className="form-control" placeholder="e.g. Main Library, Block A Corridor" value={form.location} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="date_lost">Date Lost</label>
                <input id="date_lost" name="date_lost" type="date" className="form-control" value={form.date_lost} onChange={handleChange} max={new Date().toISOString().slice(0,10)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select id="status" name="status" className="form-control" value={form.status} onChange={handleChange}>
                  <option value="lost">Lost</option>
                  <option value="claimed">Claimed / Resolved</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea id="description" name="description" className="form-control" placeholder="Any identifying features, colors, or details…" value={form.description} onChange={handleChange} style={{ minHeight:'100px' }} />
              </div>
            </div>

            <div>
              <label className="form-label">Photo (optional)</label>
              <ImageUpload value={image} onChange={setImage} label="Upload item photo" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} id="report-submit">
            {loading ? 'Submitting…' : <><Send size={16}/> {editId ? 'Update Report' : 'Submit Lost Report'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
