import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import './SearchBar.css';

const CATEGORIES = ['Electronics', 'Clothing', 'Accessories', 'Books', 'Keys', 'Wallet', 'Bag', 'ID/Card', 'Other'];

export default function SearchBar({ onSearch, initialValues = {} }) {
  const [query, setQuery] = useState(initialValues.item || '');
  const [category, setCategory] = useState(initialValues.category || '');
  const [location, setLocation] = useState(initialValues.location || '');
  const [date, setDate] = useState(initialValues.date || '');
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ item: query.trim(), category, location: location.trim(), date });
  };

  const handleClear = () => {
    setQuery(''); setCategory(''); setLocation(''); setDate('');
    onSearch({});
  };

  const hasFilters = category || location || date;

  return (
    <form className="searchbar" onSubmit={handleSubmit}>
      <div className="searchbar__main">
        <div className="searchbar__input-wrap">
          <Search size={16} className="searchbar__icon" />
          <input
            type="text"
            className="searchbar__input"
            placeholder="Search lost or found items…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            id="search-query"
          />
          {(query || hasFilters) && (
            <button type="button" className="searchbar__clear" onClick={handleClear}>
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`btn btn-secondary btn-sm searchbar__filter-btn ${hasFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={14} />
          Filters {hasFilters && <span className="searchbar__filter-dot" />}
        </button>

        <button type="submit" className="btn btn-primary btn-sm">Search</button>
      </div>

      {showFilters && (
        <div className="searchbar__filters">
          <div className="searchbar__filter-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="searchbar__filter-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Library, Cafeteria…"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          <div className="searchbar__filter-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
      )}
    </form>
  );
}
