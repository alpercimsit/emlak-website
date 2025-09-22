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
  const [showOwnerInfo, setShowOwnerInfo] = useState(false);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const thumbnailsPerPage = 5;

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
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex === 0 ? photos.length - 1 : currentImageIndex - 1;
    } else {
      newIndex = currentImageIndex === photos.length - 1 ? 0 : currentImageIndex + 1;
    }
    setCurrentImageIndex(newIndex);
    
    // Update thumbnail page if needed
    const pageIndex = Math.floor(newIndex / thumbnailsPerPage);
    const newStartIndex = pageIndex * thumbnailsPerPage;
    if (newStartIndex !== thumbnailStartIndex) {
      setThumbnailStartIndex(newStartIndex);
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
    <div style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)', position: 'relative' }}>
      {/* Geri Dönme Butonu - Sol boş alanda */}
      <button 
        className="btn btn-secondary"
        onClick={() => navigate('/')}
        style={{ 
          position: 'absolute',
          left: 'var(--spacing-md)',
          top: 'var(--spacing-xl)',
          zIndex: 10
        }}
      >
        <i className="fas fa-arrow-left" style={{ marginRight: 'var(--spacing-sm)' }}></i>
        İlanlara Dön
      </button>
      
      <div className="container">

      {/* İlan Başlığı */}
      <div className="d-flex justify-between align-center mb-4" style={{ marginTop: 'var(--spacing-lg)' }}>
        <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          {listing.baslik || 'Başlık belirtilmemiş'}
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
        {/* Sol Taraf - Fotoğraflar ve Açıklama */}
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
                      onClick={() => {
                        const newIndex = currentImageIndex === 0 ? photos.length - 1 : currentImageIndex - 1;
                        setCurrentImageIndex(newIndex);
                        const pageIndex = Math.floor(newIndex / thumbnailsPerPage);
                        const newStartIndex = pageIndex * thumbnailsPerPage;
                        if (newStartIndex !== thumbnailStartIndex) {
                          setThumbnailStartIndex(newStartIndex);
                        }
                      }}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button 
                      className="photo-nav photo-nav-next"
                      onClick={() => {
                        const newIndex = currentImageIndex === photos.length - 1 ? 0 : currentImageIndex + 1;
                        setCurrentImageIndex(newIndex);
                        const pageIndex = Math.floor(newIndex / thumbnailsPerPage);
                        const newStartIndex = pageIndex * thumbnailsPerPage;
                        if (newStartIndex !== thumbnailStartIndex) {
                          setThumbnailStartIndex(newStartIndex);
                        }
                      }}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="photo-thumbnails-container">
                  <div className="photo-thumbnails-header">
                    <span className="photo-counter">
                      {currentImageIndex + 1} / {photos.length} fotoğraf
                    </span>
                  </div>
                  <div className="photo-thumbnails-wrapper">
                    {photos.length > thumbnailsPerPage && thumbnailStartIndex > 0 && (
                      <button 
                        className="thumbnail-nav thumbnail-nav-prev"
                        onClick={() => setThumbnailStartIndex(Math.max(0, thumbnailStartIndex - thumbnailsPerPage))}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                    )}
                    <div className="photo-thumbnails">
                      {photos
                        .slice(thumbnailStartIndex, thumbnailStartIndex + thumbnailsPerPage)
                        .map((photo, displayIndex) => {
                          const actualIndex = thumbnailStartIndex + displayIndex;
                          return (
                            <img
                              key={actualIndex}
                              src={photo}
                              alt={`${listing.baslik} - ${actualIndex + 1}`}
                              className={`thumbnail ${actualIndex === currentImageIndex ? 'active' : ''}`}
                              onClick={() => setCurrentImageIndex(actualIndex)}
                            />
                          );
                        })}
                    </div>
                    {photos.length > thumbnailsPerPage && thumbnailStartIndex + thumbnailsPerPage < photos.length && (
                      <button 
                        className="thumbnail-nav thumbnail-nav-next"
                        onClick={() => setThumbnailStartIndex(Math.min(photos.length - thumbnailsPerPage, thumbnailStartIndex + thumbnailsPerPage))}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-photos">
              <i className="fas fa-image"></i>
              <p>Bu ilan için fotoğraf bulunmuyor</p>
            </div>
          )}
          
          {/* İlan Açıklaması - Fotoğrafların altında */}
          <div className="description-section" style={{ marginTop: 'var(--spacing-lg)' }}>
            <h3>İlan Açıklaması</h3>
            <div className="description-content">
              {listing.detay || 'Açıklama belirtilmemiş'}
            </div>
          </div>
        </div>

        {/* Sağ Taraf - Bilgiler ve İletişim */}
        <div className="listing-detail-info">
          {/* Fiyat - Küçültülmüş */}
          <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              {listing.fiyat.toLocaleString('tr-TR')} TL
            </div>
          </div>

          {/* Konum - Fiyatın altında */}
          <div style={{ textAlign: 'center', padding: 'var(--spacing-sm)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              {[listing.il, listing.ilce, listing.mahalle].filter(Boolean).join(' / ') || 'Konum belirtilmemiş'}
            </div>
          </div>

          {/* İletişim Bölümü - Özelliklerin üstüne taşındı */}
          <div className="contact-section" style={{ marginBottom: 'var(--spacing-md)' }}>
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
                <i className="fas fa-calendar-plus"></i>
                <span className="label">İlan Tarihi:</span>
                <span className="value">{listing.ilan_tarihi ? new Date(listing.ilan_tarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
              </div>
              <div className="info-item">
                <i className="fas fa-expand"></i>
                <span className="label">Alan:</span>
                <span className="value">{listing.m2 ? `${listing.m2} m²` : 'Belirtilmemiş'}</span>
              </div>
              
              {/* Arsa tipli ilanlar için m² fiyatı */}
              {listing.emlak_tipi === 'Arsa' && (
                <div className="info-item">
                  <i className="fas fa-calculator"></i>
                  <span className="label">m² Fiyatı:</span>
                  <span className="value">
                    {listing.m2 && listing.m2 > 0
                      ? `${Math.floor(listing.fiyat / listing.m2).toLocaleString('tr-TR')} TL/m²`
                      : 'Belirtilmemiş'
                    }
                  </span>
                </div>
              )}
              {listing.emlak_tipi === 'Arsa' && (
                <div className="info-item">
                  <i className="fas fa-map"></i>
                  <span className="label">Ada No:</span>
                  <span className="value">{listing.ada || 'Belirtilmemiş'}</span>
                </div>
              )}
              {listing.emlak_tipi === 'Arsa' && (
                <div className="info-item">
                  <i className="fas fa-map-pin"></i>
                  <span className="label">Parsel No:</span>
                  <span className="value">{listing.parsel || 'Belirtilmemiş'}</span>
                </div>
              )}
              
              {/* Sadece konut tiplerinde göster */}
              {listing.emlak_tipi !== 'Arsa' && (
                <>
                  <div className="info-item">
                    <i className="fas fa-bed"></i>
                    <span className="label">Oda Sayısı:</span>
                    <span className="value">{listing.oda_sayisi || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-building"></i>
                    <span className="label">Bina Yaşı:</span>
                    <span className="value">{listing.bina_yasi || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-layer-group"></i>
                    <span className="label">Bulunduğu Kat:</span>
                    <span className="value">{listing.bulundugu_kat != null ? listing.bulundugu_kat : 'Belirtilmemiş'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-building"></i>
                    <span className="label">Kat Sayısı:</span>
                    <span className="value">{listing.kat_sayisi != null ? listing.kat_sayisi : 'Belirtilmemiş'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-fire"></i>
                    <span className="label">Isıtma:</span>
                    <span className="value">{listing.isitma || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-bath"></i>
                    <span className="label">Banyo:</span>
                    <span className="value">{listing.banyo_sayisi != null ? listing.banyo_sayisi : 'Belirtilmemiş'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-money-bill-wave"></i>
                    <span className="label">Aidat:</span>
                    <span className="value">{listing.aidat != null && listing.aidat > 0 ? `${listing.aidat} TL` : 'Yok'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Özellikler - Sadece konut tiplerinde göster */}
            {listing.emlak_tipi !== 'Arsa' && (
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
            )}
          </div>


          {/* İlan Sahibi Bilgileri - Dönen Kart */}
          {isAdmin && (
            <div className="owner-card-container" style={{ marginBottom: 'var(--spacing-md)' }}>
              <div 
                className={`owner-flip-card ${showOwnerInfo ? 'flipped' : ''}`}
                onClick={() => setShowOwnerInfo(!showOwnerInfo)}
                style={{
                  width: '100%',
                  height: '140px',
                  perspective: '1000px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  textAlign: 'center',
                  transition: 'transform 0.6s',
                  transformStyle: 'preserve-3d',
                  transform: showOwnerInfo ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}>
                  {/* Ön Yüz */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    background: 'var(--primary-color)',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 'var(--spacing-sm)'
                  }}>
                    <i className="fas fa-user" style={{ fontSize: '2rem' }}></i>
                    <span style={{ fontWeight: 600 }}>İlan sahibi bilgileri için tıklayın</span>
                  </div>
                  
                  {/* Arka Yüz */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    background: 'var(--bg-primary)',
                    border: '2px solid var(--primary-color)',
                    borderRadius: 'var(--radius-md)',
                    transform: 'rotateY(180deg)',
                    padding: 'var(--spacing-md)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridTemplateRows: '1fr 1fr auto',
                    gap: 'var(--spacing-xs)',
                    alignItems: 'center'
                  }}>
                    {/* Sol üst - Sahibi adı */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '1', gridRow: '1' }}>
                      <i className="fas fa-user" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                      <span>{listing.sahibi_ad || 'Belirtilmemiş'}</span>
                    </div>
                    
                    {/* Sağ üst - Sahibinden ilan no */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '2', gridRow: '1' }}>
                      <i className="fas fa-hashtag" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                      <span>{listing.sahibinden_no || 'Belirtilmemiş'}</span>
                    </div>
                    
                    {/* Sol alt - Sahibi tel */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '1', gridRow: '2' }}>
                      <i className="fas fa-phone" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                      <span>{listing.sahibi_tel || 'Belirtilmemiş'}</span>
                    </div>
                    
                    {/* Sağ alt - Sahibinden tarih */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '2', gridRow: '2' }}>
                      <i className="fas fa-calendar" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                      <span>{listing.sahibinden_tarih ? new Date(listing.sahibinden_tarih).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
                    </div>
                    
                    {/* Alt - Not */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.8rem', gridColumn: '1 / 3', gridRow: '3', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-xs)' }}>
                      <i className="fas fa-sticky-note" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                      <span style={{ wordBreak: 'break-word' }}>{listing.not || 'Not yok'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

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
