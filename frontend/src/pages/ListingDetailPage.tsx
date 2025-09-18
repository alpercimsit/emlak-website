import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing } from './ListingsPage';
import api from '../utils/api';
import EditListingModal from '../components/EditListingModal';

function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('adminToken');
    setIsAdmin(token && token.startsWith('admin-token-') ? true : false);
    
    // Load the specific listing
    if (id) {
      setLoading(true);
      api.getListingById(parseInt(id))
        .then((data) => {
          setListing(data);
        })
        .catch((err) => {
          console.error('İlan yüklenirken hata:', err);
          navigate('/', { replace: true });
        })
        .finally(() => setLoading(false));
    } else {
      navigate('/', { replace: true });
    }
  }, [id, navigate]);

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
      navigate('/', { replace: true });
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
    // Reload the listing
    if (listing && id) {
      api.getListingById(parseInt(id))
        .then((data) => {
          setListing(data);
        })
        .catch((err) => console.error('İlan güncellenirken hata:', err));
    }
  };

  const handlePhotoClick = () => {
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
  };

  const handlePhotoModalNav = (direction: 'prev' | 'next') => {
    const photos = listing?.fotolar ? listing.fotolar.split(',').filter(url => url.trim()) : [];
    if (direction === 'prev') {
      setCurrentImageIndex(prev => prev === 0 ? photos.length - 1 : prev - 1);
    } else {
      setCurrentImageIndex(prev => prev === photos.length - 1 ? 0 : prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
        <div className="loading">
          <div className="spinner"></div>
          <span style={{ marginLeft: 'var(--spacing-sm)' }}>İlan yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
        <div className="empty-state">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>İlan Bulunamadı</h3>
          <p>Aradığınız ilan mevcut değil veya kaldırılmış olabilir.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            İlanlara Dön
          </button>
        </div>
      </div>
    );
  }

  const photos = listing.fotolar ? listing.fotolar.split(',').filter(url => url.trim()) : [];

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
      {/* Geri Dönme Butonu */}
      <div className="mb-4">
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/')}
          style={{ marginBottom: 'var(--spacing-md)' }}
        >
          <i className="fas fa-arrow-left" style={{ marginRight: 'var(--spacing-sm)' }}></i>
          İlanlara Dön
        </button>
      </div>

      {/* İlan Başlığı */}
      <div className="d-flex justify-between align-center mb-4">
        <h1 className="listing-detail-title">
          {listing.baslik}
          <small className="text-muted" style={{ display: 'block', fontSize: '0.6em', marginTop: 'var(--spacing-xs)' }}>
            <i className="fas fa-hashtag" style={{ fontSize: '0.8em', marginRight: '2px' }}></i>
            İlan No: {listing.ilan_no}
          </small>
        </h1>
        
        {isAdmin && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => handleEdit(listing)}
              disabled={deletingId === listing.ilan_no}
            >
              <i className="fas fa-edit" style={{ marginRight: 'var(--spacing-sm)' }}></i>
              Düzenle
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(listing.ilan_no)}
              disabled={deletingId === listing.ilan_no}
            >
              {deletingId === listing.ilan_no ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }}></div>
                  Siliniyor...
                </>
              ) : (
                <>
                  <i className="fas fa-trash" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Sil
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="listing-detail-layout">
        {/* Sol Taraf - Fotoğraflar */}
        <div className="listing-detail-photos">
          {photos.length > 0 ? (
            <>
              <div className="main-photo">
                <img 
                  src={photos[currentImageIndex]} 
                  alt={listing.baslik}
                  className="main-photo-img"
                  onClick={handlePhotoClick}
                />
                {photos.length > 1 && (
                  <>
                    <button 
                      className="photo-nav photo-nav-prev"
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? photos.length - 1 : prev - 1)}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      className="photo-nav photo-nav-next"
                      onClick={() => setCurrentImageIndex(prev => prev === photos.length - 1 ? 0 : prev + 1)}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="photo-thumbnails">
                  {photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`${listing.baslik} - ${index + 1}`}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        handlePhotoClick();
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-photos">
              <i className="fas fa-image"></i>
              <p>Bu ilan için fotoğraf bulunmuyor</p>
            </div>
          )}
        </div>

        {/* Sağ Taraf - Bilgiler ve İletişim */}
        <div className="listing-detail-info">
          {/* Fiyat */}
          <div className="price-section">
            <div className="price">
              {listing.fiyat.toLocaleString('tr-TR')} TL
            </div>
            <div className="property-type">
              {formatEmlakTipi(listing.emlak_tipi)}
            </div>
          </div>

          {/* Bilgiler */}
          <div className="info-section">
            <div className="info-grid">
              <div className="info-item">
                <i className="fas fa-hashtag"></i>
                <span className="label">İlan No:</span>
                <span className="value">{listing.ilan_no}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-home"></i>
                <span className="label">Tip:</span>
                <span className="value">{formatEmlakTipi(listing.emlak_tipi)}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-map-marker-alt"></i>
                <span className="label">Konum:</span>
                <span className="value">{listing.mahalle}, {listing.ilce}/{listing.il}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-bed"></i>
                <span className="label">Oda Sayısı:</span>
                <span className="value">{listing.oda_sayisi}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-expand"></i>
                <span className="label">Alan:</span>
                <span className="value">{listing.m2} m²</span>
              </div>
              <div className="info-item">
                <i className="fas fa-building"></i>
                <span className="label">Bina Yaşı:</span>
                <span className="value">{listing.bina_yasi}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-layer-group"></i>
                <span className="label">Kat:</span>
                <span className="value">{listing.bulundugu_kat} / {listing.kat_sayisi}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-fire"></i>
                <span className="label">Isıtma:</span>
                <span className="value">{listing.isitma}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-bath"></i>
                <span className="label">Banyo:</span>
                <span className="value">{listing.banyo_sayisi}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-money-bill-wave"></i>
                <span className="label">Aidat:</span>
                <span className="value">{listing.aidat > 0 ? `${listing.aidat} TL` : 'Yok'}</span>
              </div>
            </div>

            {/* Özellikler */}
            <div className="features">
              {listing.balkon && (
                <span className="feature">
                  <i className="fas fa-check"></i>
                  Balkon
                </span>
              )}
              {listing.asansor && (
                <span className="feature">
                  <i className="fas fa-check"></i>
                  Asansör
                </span>
              )}
              {listing.esyali && (
                <span className="feature">
                  <i className="fas fa-check"></i>
                  Eşyalı
                </span>
              )}
            </div>
          </div>

          {/* Kadastro Bilgileri */}
          {(listing.ada || listing.parsel) && (
            <div className="info-section">
              <h3>Kadastro</h3>
              <div className="info-grid">
                {listing.ada && (
                  <div className="info-item">
                    <i className="fas fa-map"></i>
                    <span className="label">Ada:</span>
                    <span className="value">{listing.ada}</span>
                  </div>
                )}
                {listing.parsel && (
                  <div className="info-item">
                    <i className="fas fa-map-pin"></i>
                    <span className="label">Parsel:</span>
                    <span className="value">{listing.parsel}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* İletişim Bölümü */}
          <div className="contact-section">
            <h3>Bizimle İletişime Geçin</h3>
            <div className="contact-info">
              <div className="contact-item">
                <i className="fas fa-phone"></i>
                <span>+90 555 123 45 67</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-envelope"></i>
                <span>info@ozkafkasemlak.com</span>
              </div>
              <div className="contact-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>Kars Merkez</span>
              </div>
            </div>
            <button className="btn btn-primary contact-btn">
              <i className="fas fa-phone" style={{ marginRight: 'var(--spacing-sm)' }}></i>
              Hemen Ara
            </button>
          </div>

          {/* Admin Bilgileri (Sadece Admin Modunda) */}
          {isAdmin && (listing.sahibi_ad || listing.sahibi_tel) && (
            <div className="info-section admin-only">
              <h3>İlan Sahibi Bilgileri</h3>
              <div className="owner-info">
                {listing.sahibi_ad && (
                  <div className="info-item">
                    <i className="fas fa-user"></i>
                    <span className="label">Ad Soyad:</span>
                    <span className="value">{listing.sahibi_ad}</span>
                  </div>
                )}
                {listing.sahibi_tel && (
                  <div className="info-item">
                    <i className="fas fa-phone"></i>
                    <span className="label">Telefon:</span>
                    <span className="value">{listing.sahibi_tel}</span>
                  </div>
                )}
                {listing.sahibinden_no && (
                  <div className="info-item">
                    <i className="fas fa-hashtag"></i>
                    <span className="label">Sahibinden No:</span>
                    <span className="value">{listing.sahibinden_no}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* İlan Açıklaması */}
      {listing.detay && (
        <div className="description-section">
          <h3>İlan Açıklaması</h3>
          <div className="description-content">
            {listing.detay}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingListing && (
        <EditListingModal
          listing={editingListing}
          isOpen={true}
          onClose={handleCloseEdit}
          onUpdate={handleUpdateSuccess}
        />
      )}

      {/* Photo Modal */}
      {showPhotoModal && photos.length > 0 && (
        <div className="photo-modal" onClick={handleClosePhotoModal}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="photo-modal-close"
              onClick={handleClosePhotoModal}
            >
              <i className="fas fa-times"></i>
            </button>
            
            <img 
              src={photos[currentImageIndex]} 
              alt={`${listing.baslik} - ${currentImageIndex + 1}`}
              className="photo-modal-img"
            />
            
            {photos.length > 1 && (
              <>
                <button 
                  className="photo-modal-nav photo-modal-nav-prev"
                  onClick={() => handlePhotoModalNav('prev')}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button 
                  className="photo-modal-nav photo-modal-nav-next"
                  onClick={() => handlePhotoModalNav('next')}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListingDetailPage;
