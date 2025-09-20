import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing } from '../pages/ListingsPage';
import api from '../utils/api';
import EditListingModal from './EditListingModal';

interface Props {
  listings: Listing[];
  isAdmin?: boolean;
  onUpdate?: () => void;
}

function ListingList({ listings, isAdmin = false, onUpdate }: Props) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  // Emlak tipi görüntüleme için helper fonksiyon
  const formatEmlakTipi = (emlakTipi: string) => {
    switch (emlakTipi) {
      case 'kiralikDaire':
        return 'Kiralık Daire';
      case 'satilikDaire':
        return 'Satılık Daire';
      case 'Arsa':
        return 'Arsa';
      case 'Daire':
        return 'Daire';
      default:
        return emlakTipi;
    }
  };

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

  const handleListingClick = (listingId: number) => {
    navigate(`/ilan/${listingId}`);
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
    <div className="listings-grid">
      {listings.map((l) => (
        <div key={l.ilan_no} className="card listing-card-compact" onClick={() => handleListingClick(l.ilan_no)} style={{ cursor: 'pointer' }}>
          {/* Sol taraf - Kare fotoğraf */}
          <div className="listing-image-container">
            {l.fotolar ? (
              <img src={l.fotolar.split(',')[0]} alt={l.baslik} className="listing-image-square" />
            ) : (
              <div className="listing-no-image">
                <i className="fas fa-image"></i>
              </div>
            )}
          </div>
          
          {/* Sağ taraf - İlan bilgileri */}
          <div className="listing-info">
            <div className="listing-header">
              <div className="listing-title-compact">{l.baslik || 'Başlık belirtilmemiş'}</div>
              <div className="listing-price-compact">
                {l.fiyat.toLocaleString('tr-TR')} TL
              </div>
            </div>
            
            <div className="listing-meta-compact">
              <div className="meta-row">
                <span>
                  <i className="fas fa-expand"></i>
                  {l.m2 ? `${l.m2} m²` : 'Belirtilmemiş'}
                </span>
                {l.emlak_tipi === 'Arsa' && l.m2 && l.m2 > 0 && (
                  <span>
                    <i className="fas fa-calculator"></i>
                    {Math.floor(l.fiyat / l.m2).toLocaleString('tr-TR')} TL/m²
                  </span>
                )}
                {l.emlak_tipi === 'Arsa' && (
                  <span>
                    <i className="fas fa-map"></i>
                    Ada: {l.ada || 'Belirtilmemiş'}
                  </span>
                )}
                {l.emlak_tipi === 'Arsa' && (
                  <span>
                    <i className="fas fa-map-pin"></i>
                    Parsel: {l.parsel || 'Belirtilmemiş'}
                  </span>
                )}
                {l.emlak_tipi !== 'Arsa' && (
                  <span>
                    <i className="fas fa-bed"></i>
                    {l.oda_sayisi || 'Belirtilmemiş'}
                  </span>
                )}
                {l.emlak_tipi !== 'Arsa' && (
                  <span>
                    <i className="fas fa-layer-group"></i>
                    {l.bulundugu_kat != null ? `${l.bulundugu_kat}. kat` : 'Belirtilmemiş'}
                  </span>
                )}
                {l.emlak_tipi !== 'Arsa' && l.kat_sayisi != null && (
                  <span>
                    <i className="fas fa-building"></i>
                    {l.kat_sayisi} katlı
                  </span>
                )}
              </div>
              <div className="meta-row location">
                <span>
                  <i className="fas fa-map-marker-alt"></i>
                  {[l.il, l.ilce, l.mahalle].filter(Boolean).join(' / ') || 'Konum belirtilmemiş'}
                </span>
              </div>
            </div>
            
            {isAdmin && (
              <div className="admin-actions-compact">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(l);
                  }}
                  disabled={deletingId === l.ilan_no}
                  title="Düzenle"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(l.ilan_no);
                  }}
                  disabled={deletingId === l.ilan_no}
                  title="Sil"
                >
                  {deletingId === l.ilan_no ? (
                    <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                  ) : (
                    <i className="fas fa-trash"></i>
                  )}
                </button>
              </div>
            )}
          </div>
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

