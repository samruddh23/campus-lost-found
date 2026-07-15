import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, MapPin, ShieldCheck, Zap, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import ItemCard from '../components/ItemCard';
import './Landing.css';

export default function Landing() {
  const [recentLost, setRecentLost] = useState([]);
  const [recentFound, setRecentFound] = useState([]);
  const [stats, setStats] = useState({ lost: 0, found: 0 });

  useEffect(() => {
    api.get('/lost').then(r => {
      const sorted = [...r.data].reverse();
      setRecentLost(sorted.slice(0, 3));
      setStats(s => ({ ...s, lost: r.data.length }));
    }).catch(() => {});
    api.get('/found').then(r => {
      const sorted = [...r.data].reverse();
      setRecentFound(sorted.slice(0, 3));
      setStats(s => ({ ...s, found: r.data.length }));
    }).catch(() => {});
  }, []);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__orb hero__orb--1" />
          <div className="hero__orb hero__orb--2" />
          <div className="hero__orb hero__orb--3" />
        </div>
        <div className="container hero__content">
          <div className="hero__badge">
            <Zap size={12} />
            AI-Powered Matching
          </div>
          <h1 className="hero__title">
            Find What's Lost.<br />
            <span>Return What's Found.</span>
          </h1>
          <p className="hero__sub">
            Campus's smartest lost &amp; found platform. Report items, get AI match suggestions,
            and reunite belongings with their owners — all in one place.
          </p>
          <div className="hero__actions">
            <Link to="/browse" className="btn btn-primary btn-lg">
              <Search size={18} /> Browse Items
            </Link>
            <Link to="/report/lost" className="btn btn-secondary btn-lg">
              Report Lost Item <ArrowRight size={18} />
            </Link>
          </div>

          {/* Stats */}
          <div className="hero__stats">
            <div className="hero__stat">
              <strong>{stats.lost}</strong>
              <span>Lost Reports</span>
            </div>
            <div className="hero__stat-div" />
            <div className="hero__stat">
              <strong>{stats.found}</strong>
              <span>Found Reports</span>
            </div>
            <div className="hero__stat-div" />
            <div className="hero__stat">
              <strong>AI</strong>
              <span>Smart Matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features container">
        <div className="features__grid">
          {[
            { icon: <Search size={22}/>, title:'Smart Search', desc:'Filter by category, location, and date to quickly find relevant reports.' },
            { icon: <Zap size={22}/>, title:'AI Matching', desc:'Our AI automatically scores and ranks the best matches between lost and found items.' },
            { icon: <MapPin size={22}/>, title:'Location Aware', desc:'Each report includes location data so you know exactly where to look.' },
            { icon: <ShieldCheck size={22}/>, title:'Verified Reports', desc:'Admin moderation keeps the database clean and trustworthy.' },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-card__icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Lost */}
      {recentLost.length > 0 && (
        <section className="container recent-section">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="section-title">Recently Lost</h2>
              <p className="section-subtitle">Help someone find their missing belongings</p>
            </div>
            <Link to="/browse" className="btn btn-secondary btn-sm">View all <ArrowRight size={14}/></Link>
          </div>
          <div className="items-grid">
            {recentLost.map(item => <ItemCard key={item.id} item={item} type="lost" />)}
          </div>
        </section>
      )}

      {/* Recent Found */}
      {recentFound.length > 0 && (
        <section className="container recent-section">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="section-title">Recently Found</h2>
              <p className="section-subtitle">These items are waiting to be claimed</p>
            </div>
            <Link to="/browse" className="btn btn-secondary btn-sm">View all <ArrowRight size={14}/></Link>
          </div>
          <div className="items-grid">
            {recentFound.map(item => <ItemCard key={item.id} item={item} type="found" />)}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section container">
        <div className="cta-card">
          <TrendingUp size={32} className="cta-card__icon" />
          <h2>Lost something on campus?</h2>
          <p>Report it now and let our AI find a match for you.</p>
          <div className="cta-card__actions">
            <Link to="/report/lost" className="btn btn-primary">Report Lost Item</Link>
            <Link to="/report/found" className="btn btn-accent">I Found Something</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
