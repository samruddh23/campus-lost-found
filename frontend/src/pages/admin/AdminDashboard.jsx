import { useState, useEffect } from 'react';
import { Package, PackageOpen, Users, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card" style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
      <div style={{
        width:50, height:50, borderRadius:14, flexShrink:0,
        background:`${color}20`, border:`1px solid ${color}40`,
        display:'flex', alignItems:'center', justifyContent:'center', color
      }}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-muted text-xs" style={{ marginBottom:'0.1rem' }}>{label}</p>
        <p style={{ fontSize:'1.5rem', fontWeight:800 }}>{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/reports'),
      api.get('/admin/users'),
    ]).then(([rep, usr]) => {
      setData(rep.data);
      setUserCount(usr.data.length);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage={false} />;

  return (
    <div>
      <h2 className="section-title">Dashboard</h2>
      <p className="section-subtitle">Platform overview at a glance</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
        <StatCard icon={Package} label="Lost Items" value={data?.total_lost ?? 0} color="var(--color-danger)" />
        <StatCard icon={PackageOpen} label="Found Items" value={data?.total_found ?? 0} color="var(--color-success)" />
        <StatCard icon={Users} label="Total Users" value={userCount} color="var(--color-accent)" />
        <StatCard icon={TrendingUp} label="Total Reports" value={(data?.total_lost ?? 0) + (data?.total_found ?? 0)} color="var(--color-primary-h)" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        {/* Recent Lost */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.9rem' }}>Recent Lost Reports</h3>
          {(data?.lost || []).slice(0, 5).map(i => (
            <div key={i.id} style={{ padding:'0.6rem 0', borderBottom:'1px solid var(--color-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:600, fontSize:'0.85rem' }}>{i.item_name}</span>
              <span className="badge badge-lost">{i.status}</span>
            </div>
          ))}
          {(!data?.lost || data.lost.length === 0) && <p className="text-muted text-sm">No reports yet.</p>}
        </div>

        {/* Recent Found */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'0.9rem' }}>Recent Found Reports</h3>
          {(data?.found || []).slice(0, 5).map(i => (
            <div key={i.id} style={{ padding:'0.6rem 0', borderBottom:'1px solid var(--color-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:600, fontSize:'0.85rem' }}>{i.item_name}</span>
              <span className="badge badge-found">{i.status}</span>
            </div>
          ))}
          {(!data?.found || data.found.length === 0) && <p className="text-muted text-sm">No reports yet.</p>}
        </div>
      </div>
    </div>
  );
}
