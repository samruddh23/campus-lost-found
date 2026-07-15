import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, User, ImageOff } from 'lucide-react';
import './ItemCard.css';

const IMAGE_BASE = 'http://127.0.0.1:5000/uploads/';

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ItemCard({ item, type }) {
  const date = type === 'lost' ? item.date_lost : item.date_found;
  const imageUrl = item.image
    ? item.image.startsWith('http') ? item.image : `${IMAGE_BASE}${item.image}`
    : null;

  return (
    <Link to={`/items/${type}/${item.id}`} className="item-card">
      {/* Image */}
      <div className="item-card__img">
        {imageUrl ? (
          <img src={imageUrl} alt={item.item_name} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
        ) : null}
        <div className="item-card__no-img" style={{ display: imageUrl ? 'none' : 'flex' }}>
          <ImageOff size={28} />
        </div>
        <span className={`item-card__type-badge badge badge-${type}`}>{type}</span>
      </div>

      {/* Content */}
      <div className="item-card__body">
        <h3 className="item-card__name">{item.item_name}</h3>

        {item.description && (
          <p className="item-card__desc">{item.description}</p>
        )}

        <div className="item-card__meta">
          <span className="item-card__meta-item">
            <Tag size={11} />
            {item.category}
          </span>
          <span className="item-card__meta-item">
            <MapPin size={11} />
            {item.location}
          </span>
          {date && (
            <span className="item-card__meta-item">
              <Calendar size={11} />
              {formatDate(date)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
