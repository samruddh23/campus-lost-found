import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Tag, User, Zap, Trash2, Edit, ArrowLeft, ImageOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './ItemDetail.css';

const IMAGE_BASE = 'http://127.0.0.1:5000/uploads/';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'long', day:'numeric' });
}

export default function ItemDetail() {
  const { type, id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingItem, setLoadingItem] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoadingItem(true);
    api.get(`/${type}/${id}`)
      .then(r => setItem(r.data))
      .catch(() => toast.error('Item not found'))
      .finally(() => setLoadingItem(false));
  }, [type, id]);

  const loadMatches = () => {
    setLoadingMatches(true);
    api.get(`/${type}/${id}/matches`)
      .then(r => setMatches(r.data))
      .catch(() => toast.error('Could not load matches'))
      .finally(() => setLoadingMatches(false));
  };

  const handleDelete = async () => {
    if (!confirm('Delete this report?')) return;
    setDeleting(true);
    try {
      await api.delete(`/${type}/${id}`);
      toast.success('Report deleted');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
      setDeleting(false);
    }
  };

  const canEdit = user && (user.id === item?.user_id || isAdmin);

  if (loadingItem) return <LoadingSpinner />;
  if (!item) return (
    <div className="page-wrapper">
      <div className="container empty-state">
        <h3>Item not found</h3>
        <Link to="/browse" className="btn btn-primary mt-4">Back to Browse</Link>
      </div>
    </div>
  );

  const date = type === 'lost' ? item.date_lost : item.date_found;
  const imageUrl = item.image ? (item.image.startsWith('http') ? item.image : `${IMAGE_BASE}${item.image}`) : null;

  return (
    <div className="page-wrapper item-detail-page">
      <div className="container">
        {/* Back */}
        <button className="item-detail__back btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>

        <div className="item-detail__layout">
          {/* Left: Image */}
          <div className="item-detail__left">
            <div className="item-detail__img">
              {imageUrl ? (
                <img src={imageUrl} alt={item.item_name} />
              ) : (
                <div className="item-detail__no-img"><ImageOff size={48} /></div>
              )}
              <span className={`badge badge-${type} item-detail__type`}>{type}</span>
            </div>

            {/* Status */}
            <div className={`item-detail__status item-detail__status--${item.status}`}>
              <CheckCircle size={14} />
              Status: <strong>{item.status}</strong>
            </div>
          </div>

          {/* Right: Info */}
          <div className="item-detail__right">
            <div className="item-detail__header">
              <h1 className="item-detail__name">{item.item_name}</h1>
              {canEdit && (
                <div className="item-detail__actions">
                  <Link to={`/report/${type}?edit=${id}`} className="btn btn-secondary btn-sm">
                    <Edit size={14}/> Edit
                  </Link>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                    <Trash2 size={14}/> {deleting ? '…' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            {item.description && (
              <p className="item-detail__desc">{item.description}</p>
            )}

            <div className="item-detail__meta-grid">
              <div className="item-detail__meta-item">
                <Tag size={14} className="text-primary" />
                <div><span className="text-muted text-xs">Category</span><p>{item.category}</p></div>
              </div>
              <div className="item-detail__meta-item">
                <MapPin size={14} className="text-primary" />
                <div><span className="text-muted text-xs">Location</span><p>{item.location}</p></div>
              </div>
              <div className="item-detail__meta-item">
                <Calendar size={14} className="text-primary" />
                <div>
                  <span className="text-muted text-xs">{type === 'lost' ? 'Date Lost' : 'Date Found'}</span>
                  <p>{formatDate(date)}</p>
                </div>
              </div>
              <div className="item-detail__meta-item">
                <User size={14} className="text-primary" />
                <div><span className="text-muted text-xs">Reported</span><p>{formatDate(item.created_at)}</p></div>
              </div>
            </div>

            <hr className="divider" />

            {/* AI Matches */}
            <div className="item-detail__matches">
              <div className="item-detail__matches-header">
                <h3><Zap size={16} className="text-primary" /> AI Match Suggestions</h3>
                <button className="btn btn-accent btn-sm" onClick={loadMatches} disabled={loadingMatches} id="find-matches-btn">
                  {loadingMatches ? 'Searching…' : 'Find Matches'}
                </button>
              </div>

              {matches.length > 0 ? (
                <div className="item-detail__match-list">
                  {matches.map((m, i) => (
                    <MatchCard key={i} match={m} matchType={type === 'lost' ? 'found' : 'lost'} />
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm" style={{ marginTop:'0.75rem' }}>
                  Click "Find Matches" to run AI-powered matching across {type === 'lost' ? 'found' : 'lost'} items.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
