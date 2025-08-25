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
        <div key={l.ilanNo} className="card listing-card">
          <div className="listing-content">
            <div className="listing-title">{l.baslik}</div>
            <div className="listing-description">{l.detay}</div>
            <div className="listing-price">
              {l.fiyat.toLocaleString('tr-TR')} TL
            </div>
            <div className="listing-meta">
              <span>
                <i className="fas fa-bed"></i>
                {l.odaSayisi}
              </span>
              <span>
                <i className="fas fa-expand"></i>
                {l.m2} m²
              </span>
              <span>
                <i className="fas fa-map-marker-alt"></i>
                {l.mahalle}, {l.ilce}/{l.il}
              </span>
              <span>
                <i className="fas fa-home"></i>
                {l.emlakTipi}
              </span>
            </div>
            <div className="listing-details">
              <small className="text-muted">
                <i className="fas fa-user"></i> {l.sahibiAd} • 
                <i className="fas fa-phone"></i> {l.sahibiTel}
              </small>
            </div>
          </div>
          {l.fotolar && (
            <img src={l.fotolar.split(',')[0]} alt={l.baslik} className="listing-image" />
          )}
        </div>
      ))}
    </div>
  );
}

export default ListingList;

