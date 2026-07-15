import { useState, useEffect } from 'react';
import { Trash2, Package, PackageOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminReports() {
  const [lost, setLost] = useState([]);
  const [found, setFound] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('lost');

  useEffect(() => {
    api.get('/admin/reports')
      .then(r => { setLost(r.data.lost || []); setFound(r.data.found || []); })
      .catch(() => toast.error('Could not load reports'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (type, id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/reports/${type}/${id}`);
      if (type === 'lost') setLost(p => p.filter(i => i.id !== id));
      else setFound(p => p.filter(i => i.id !== id));
      toast.success('Report removed');
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const items = tab === 'lost' ? lost : found;

  return (
    <div>
      <h2 className="section-title">All Reports</h2>
      <p className="section-subtitle">Moderate and manage all submitted reports</p>

      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
        {[['lost','Lost'], ['found','Found']].map(([key, label]) => (
          <button
            key={key}
            id={`admin-tab-${key}`}
            className={`btn btn-sm ${tab===key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(key)}
          >
            {key==='lost' ? <Package size={13}/> : <PackageOpen size={13}/>}
            {label} ({(key==='lost' ? lost : found).length})
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner fullPage={false} /> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Reporter ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--color-muted)', padding:'2rem' }}>No reports</td></tr>
              ) : items.map(item => (
                <tr key={item.id}>
                  <td className="text-muted text-sm">#{item.id}</td>
                  <td style={{ fontWeight:600 }}>{item.item_name}</td>
                  <td><span className="badge badge-user">{item.category}</span></td>
                  <td className="text-sm text-muted">{item.location}</td>
                  <td><span className={`badge badge-${item.status === 'lost' ? 'lost' : item.status === 'found' ? 'found' : 'claimed'}`}>{item.status}</span></td>
                  <td className="text-muted text-sm">{item.user_id}</td>
                  <td>
                    <button
                      id={`delete-report-${tab}-${item.id}`}
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(tab, item.id, item.item_name)}
                    >
                      <Trash2 size={13}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
