import { useState, useEffect } from 'react';
import { Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Could not load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleToggle = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change ${u.name}'s role to "${newRole}"?`)) return;
    try {
      const { data } = await api.put(`/admin/users/${u.id}/role`, { role: newRole });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: data.user.role } : x));
      toast.success('Role updated');
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed'); }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Delete user "${u.name}"? This also removes their reports.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  return (
    <div>
      <h2 className="section-title">User Management</h2>
      <p className="section-subtitle">Manage roles and accounts for all campus users</p>

      {loading ? <LoadingSpinner fullPage={false} /> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="text-muted text-sm">#{u.id}</td>
                  <td style={{ fontWeight:600 }}>
                    {u.name} {u.id === me?.id && <span style={{ fontSize:'0.7rem', color:'var(--color-primary-h)' }}>(you)</span>}
                  </td>
                  <td className="text-sm text-muted">{u.email}</td>
                  <td className="text-sm text-muted">{u.phone || '—'}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td className="text-muted text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <div style={{ display:'flex', gap:'0.4rem' }}>
                      {u.id !== me?.id && (
                        <>
                          <button
                            id={`toggle-role-${u.id}`}
                            title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            className={`btn btn-sm ${u.role === 'admin' ? 'btn-secondary' : 'btn-accent'}`}
                            onClick={() => handleRoleToggle(u)}
                          >
                            {u.role === 'admin' ? <ShieldOff size={13}/> : <ShieldCheck size={13}/>}
                          </button>
                          <button
                            id={`delete-user-${u.id}`}
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(u)}
                          >
                            <Trash2 size={13}/>
                          </button>
                        </>
                      )}
                    </div>
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
