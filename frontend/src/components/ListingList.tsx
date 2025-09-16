import { useState } from 'react';
import { Listing } from '../pages/ListingsPage';
import api from '../utils/api';
import EditListingModal from './EditListingModal';

interface Props {
  listings: Listing[];
  isAdmin?: boolean;
  onUpdate?: () => void;
}

function ListingList({ listings, isAdmin = false, onUpdate }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  const handleDelete = async (listingId: number) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
      return;
    }

    setDeletingId(listingId);
    try {
      await api.deleteListing(listingId);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('İlan silinirken hata:', error);
      alert('İlan silinirken bir hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
  };

  const handleCloseEdit = () => {
    setEditingListing(null);
  };

  const handleUpdateSuccess = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

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
        <div key={l.ilan_no} className="card listing-card">
          <div className="listing-content">
            <div className="d-flex justify-between align-center mb-2">
              <div className="listing-title">{l.baslik}</div>
              <div className="listing-number">
                <small className="text-muted">
                  <i className="fas fa-hashtag" style={{ fontSize: '0.8em', marginRight: '2px' }}></i>
                  {l.ilan_no}
                </small>
              </div>
            </div>
            <div className="listing-description">{l.detay}</div>
            <div className="listing-price">
              {l.fiyat.toLocaleString('tr-TR')} TL
            </div>
            <div className="listing-meta">
              <span>
                <i className="fas fa-bed"></i>
                {l.oda_sayisi}
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
                {l.emlak_tipi}
              </span>
            </div>
            {(isAdmin || (l.sahibi_ad && l.sahibi_tel)) && (
              <div className="listing-details">
                <small className="text-muted">
                  {l.sahibi_ad && (
                    <>
                      <i className="fas fa-user"></i> {l.sahibi_ad}
                      {l.sahibi_tel && ' • '}
                    </>
                  )}
                  {l.sahibi_tel && (
                    <>
                      <i className="fas fa-phone"></i> {l.sahibi_tel}
                    </>
                  )}
                </small>
              </div>
            )}
            {isAdmin && (
              <div className="admin-actions" style={{ marginTop: 'var(--spacing-sm)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleEdit(l)}
                  disabled={deletingId === l.ilan_no}
                >
                  <i className="fas fa-edit"></i>
                  Düzenle
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(l.ilan_no)}
                  disabled={deletingId === l.ilan_no}
                >
                  {deletingId === l.ilan_no ? (
                    <>
                      <div className="spinner" style={{ width: '12px', height: '12px', marginRight: 'var(--spacing-xs)' }}></div>
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash"></i>
                      Sil
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          {l.fotolar && (
            <img src={l.fotolar.split(',')[0]} alt={l.baslik} className="listing-image" />
          )}
        </div>
      ))}
      
      {/* Edit Modal */}
      {editingListing && (
        <EditListingModal
          listing={editingListing}
          isOpen={true}
          onClose={handleCloseEdit}
          onUpdate={handleUpdateSuccess}
        />
      )}
    </div>
  );
}

export default ListingList;

