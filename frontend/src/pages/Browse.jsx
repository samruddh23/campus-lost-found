import { useState, useEffect, useCallback } from 'react';
import { Package, PackageOpen, LayoutGrid } from 'lucide-react';
import api from '../api/axios';
import SearchBar from '../components/SearchBar';
import ItemCard from '../components/ItemCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './Browse.css';

const TABS = [
  { id: 'all',   label: 'All Items',   icon: LayoutGrid },
  { id: 'lost',  label: 'Lost Items',  icon: Package },
  { id: 'found', label: 'Found Items', icon: PackageOpen },
];

export default function Browse() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({});

  const fetchItems = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v))).toString();
      const hasSearch = qs.length > 0;

      if (hasSearch) {
        const { data } = await api.get(`/search?${qs}`);
        setItems(data);
      } else {
        const [lost, found] = await Promise.all([
          api.get('/lost').then(r => r.data.map(i => ({ ...i, item_type:'lost' }))),
          api.get('/found').then(r => r.data.map(i => ({ ...i, item_type:'found' }))),
        ]);
        setItems([...lost.reverse(), ...found.reverse()]);
      }
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(searchParams); }, [searchParams, fetchItems]);

  const handleSearch = (params) => { setSearchParams(params); };

  const displayed = tab === 'all' ? items
    : items.filter(i => i.item_type === tab);

  return (
    <div className="page-wrapper browse-page">
      <div className="container">
        <div className="mb-6">
          <h1 className="section-title">Browse Items</h1>
          <p className="section-subtitle">Search through all lost and found reports on campus</p>
        </div>

        <SearchBar onSearch={handleSearch} initialValues={searchParams} />

        {/* Tabs */}
        <div className="browse-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              className={`browse-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={15} /> {t.label}
              <span className="browse-tab__count">
                {t.id === 'all' ? items.length : items.filter(i => i.item_type === t.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner fullPage={false} />
        ) : displayed.length === 0 ? (
          <div className="empty-state">
            <Package />
            <h3>No items found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="items-grid animate-fade-in">
            {displayed.map(item => (
              <ItemCard key={`${item.item_type}-${item.id}`} item={item} type={item.item_type} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
