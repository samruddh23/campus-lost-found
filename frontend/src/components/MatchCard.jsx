import { Link } from 'react-router-dom';
import { MapPin, Tag, Zap, ImageOff } from 'lucide-react';

const IMAGE_BASE = 'http://127.0.0.1:5000/uploads/';

function getConfidenceColor(score) {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function MatchCard({ match, matchType }) {
  const { matched_item, confidence_score } = match;
  if (!matched_item) return null;

  const color = getConfidenceColor(confidence_score);
  const imageUrl = matched_item.image
    ? matched_item.image.startsWith('http') ? matched_item.image : `${IMAGE_BASE}${matched_item.image}`
    : null;

  return (
    <Link to={`/items/${matchType}/${matched_item.id}`} className="card" style={{ display:'block', textDecoration:'none', color:'inherit', padding:'1rem' }}>
      <div style={{ display:'flex', gap:'0.875rem', alignItems:'flex-start' }}>
        {/* Thumbnail */}
        <div style={{ width:64, height:64, borderRadius:'var(--radius-md)', overflow:'hidden', flexShrink:0, background:'var(--color-surface2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-faint)' }}>
          {imageUrl
            ? <img src={imageUrl} alt={matched_item.item_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <ImageOff size={20} />
          }
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem', marginBottom:'0.35rem' }}>
            <h4 style={{ fontWeight:700, fontSize:'0.9rem', lineHeight:1.3 }}>{matched_item.item_name}</h4>
            <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.8rem', fontWeight:700, color, flexShrink:0 }}>
              <Zap size={12} /> {Math.round(confidence_score)}%
            </span>
          </div>

          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.73rem', color:'var(--color-muted)' }}>
              <Tag size={10}/> {matched_item.category}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.73rem', color:'var(--color-muted)' }}>
              <MapPin size={10}/> {matched_item.location}
            </span>
          </div>

          {/* Confidence bar */}
          <div className="confidence-bar" style={{ marginTop:'0.6rem' }}>
            <div className="confidence-fill" style={{ width:`${confidence_score}%`, background:`linear-gradient(90deg, ${color}88, ${color})` }} />
          </div>
          <p style={{ fontSize:'0.7rem', color:'var(--color-muted)', marginTop:'0.2rem' }}>
            {confidence_score >= 75 ? 'Strong match' : confidence_score >= 50 ? 'Possible match' : 'Weak match'}
          </p>
        </div>
      </div>
    </Link>
  );
}
