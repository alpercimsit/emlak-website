import { Listing } from '../pages/ListingsPage';

interface Props {
  listings: Listing[];
}

function ListingList({ listings }: Props) {
  if (!listings.length) {
    return (
      <div className="empty-state">
        <i className="fas fa-home"></i>
        <h3>Henüz İlan Yok</h3>
        <p>Yakında yeni emlak ilanları eklenecektir.</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {listings.map((l) => (
        <div key={l.id} className="card listing-card">
          <div className="listing-content">
            <div className="listing-title">{l.title}</div>
            <div className="listing-description">{l.description}</div>
            <div className="listing-price">
              {l.price.toLocaleString('tr-TR')} TL
            </div>
            <div className="listing-meta">
              <span>
                <i className="fas fa-bed"></i>
                {l.rooms} Oda
              </span>
              <span>
                <i className="fas fa-map-marker-alt"></i>
                {l.latitude.toFixed(4)}, {l.longitude.toFixed(4)}
              </span>
            </div>
          </div>
          {l.imageUrl && (
            <img src={l.imageUrl} alt={l.title} className="listing-image" />
          )}
        </div>
      ))}
    </div>
  );
}

export default ListingList;

