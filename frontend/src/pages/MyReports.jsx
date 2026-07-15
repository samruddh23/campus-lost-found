import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, PackageOpen, Trash2, Edit, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import './MyReports.css';

const IMAGE_BASE = 'http://127.0.0.1:5000/uploads/';

function ItemRow({ item, type, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const imageUrl = item.image ? (item.image.startsWith('http') ? item.image : `${IMAGE_BASE}${item.image}`) : null;

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.item_name}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/${type}/${item.id}`);
      onDelete(item.id, type);
      toast.success('Report deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
      setDeleting(false);
    }
  };

  return (
    <div className="my-report-row card">
      <div className="my-report-row__img">
        {imageUrl ? <img src={imageUrl} alt={item.item_name} /> : <span className="my-report-row__no-img">{type === 'lost' ? <Package size={20}/> : <PackageOpen size={20}/>}</span>}
      </div>
      <div className="my-report-row__info">
        <div className="my-report-row__top">
          <span className={`badge badge-${type}`}>{type}</span>
          <span className={`badge badge-${item.status === 'claimed' ? 'claimed' : item.status === 'lost' ? 'lost' : 'found'}`}>{item.status}</span>
        </div>
        <h3 className="my-report-row__name">{item.item_name}</h3>
        <p className="text-muted text-sm">{item.category} · {item.location}</p>
      </div>
      <div className="my-report-row__actions">
        <Link to={`/items/${type}/${item.id}`} className="btn btn-secondary btn-sm">View</Link>
        <Link to={`/report/${type}?edit=${item.id}`} className="btn btn-secondary btn-sm">
          <Edit size={13}/>
        </Link>
        <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
          <Trash2 size={13}/>
        </button>
      </div>
    </div>
  );
}

export default function MyReports() {
  const [lost, setLost] = useState([]);
  const [found, setFound] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('lost');

  useEffect(() => {
    Promise.all([api.get('/lost'), api.get('/found')])
      .then(([l, f]) => {
        // Note: backend returns all items; filter by user would need profile check
        setLost([...l.data].reverse());
        setFound([...f.data].reverse());
      })
      .catch(() => toast.error('Could not load reports'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id, type) => {
    if (type === 'lost') setLost(prev => prev.filter(i => i.id !== id));
    else setFound(prev => prev.filter(i => i.id !== id));
  };

  const items = tab === 'lost' ? lost : found;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="section-title" style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <ClipboardList size={22} /> My Reports
            </h1>
            <p className="section-subtitle">Manage your lost and found submissions</p>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <Link to="/report/lost" className="btn btn-secondary btn-sm">+ Report Lost</Link>
            <Link to="/report/found" className="btn btn-accent btn-sm">+ Report Found</Link>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
          {[['lost','Lost'], ['found','Found']].map(([key, label]) => (
            <button
              key={key}
              id={`my-tab-${key}`}
              className={`btn ${tab === key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setTab(key)}
            >
              {key === 'lost' ? <Package size={14}/> : <PackageOpen size={14}/>}
              {label} ({(key === 'lost' ? lost : found).length})
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner fullPage={false} />
        ) : items.length === 0 ? (
          <div className="empty-state">
            {tab === 'lost' ? <Package /> : <PackageOpen />}
            <h3>No {tab} reports yet</h3>
            <p>
              <Link to={`/report/${tab}`} className="text-primary">Create your first {tab} report</Link>
            </p>
          </div>
        ) : (
          <div className="my-reports-list">
            {items.map(item => (
              <ItemRow key={item.id} item={item} type={tab} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
