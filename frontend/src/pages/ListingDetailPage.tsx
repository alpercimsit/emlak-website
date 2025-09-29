import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing } from './ListingsPage';
import api, { supabase } from '../utils/api';
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
  const [thumbnailPage, setThumbnailPage] = useState(0);
  const thumbnailsPerPage = 10;
  const [isPhotoChanging, setIsPhotoChanging] = useState(false);
  const [photoChangeDirection, setPhotoChangeDirection] = useState<'left' | 'right' | null>(null);
  const [thumbnailSlideDirection, setThumbnailSlideDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    // Check if user is admin using Supabase Auth
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAdminUser = session?.user?.user_metadata?.role === 'admin';
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
    
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

    // Tüm state güncellemelerini aynı anda yap
    setCurrentImageIndex(newIndex);

    // Update thumbnail page if needed
    const pageIndex = Math.floor(newIndex / thumbnailsPerPage);
    const newStartIndex = pageIndex * thumbnailsPerPage;
    if (newStartIndex !== thumbnailStartIndex) {
      setThumbnailStartIndex(newStartIndex);
      setThumbnailPage(pageIndex);
    }

    // CSS animasyonunu tetikle - yön bilgisi ile birlikte
    const changeDirection = direction === 'prev' ? 'left' : 'right';
    setPhotoChangeDirection(changeDirection);
    setIsPhotoChanging(true);

    // Animasyon bittikten sonra state'leri sıfırla
    setTimeout(() => {
      setIsPhotoChanging(false);
      setPhotoChangeDirection(null);
    }, 400); // Modal animasyonu 0.4s olduğu için 400ms
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
      
      <div className="container">

      {/* Üst Kısım - İlan Başlığı ve İletişim */}
      <div className="d-flex justify-between align-start mb-4" style={{ marginTop: 0 }}>
        <h1 style={{ color: 'var(--text-primary)', position: 'relative', top: 20, fontSize: '1.5rem', fontWeight: 600, flex: 1 }}>
          {listing.baslik || 'Başlık belirtilmemiş'}
        </h1>

        {/* İletişim Bölümü - İlan Başlığı Yanında */}
        <div
          className="contact-section contact-header contact-large"
          style={{ marginLeft: 'var(--spacing-lg)', backgroundColor: 'var(--bg-primary)' }}
        >
          <h3
            style={{ fontSize: '1.1rem', margin: 0, bottom: 13, position: 'relative', cursor: 'pointer' }}
            onClick={() => navigate('/iletisim')}
            onMouseEnter={(e) => (e.target as HTMLElement).style.textDecoration = 'underline'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.textDecoration = 'none'}
          >
            Bizimle İletişime Geçin
          </h3>
          <div className="contact-info-horizontal" style={{ position: 'relative', bottom: 13 }}>
            <div className="contact-item" >
              <i className="fas fa-map-marker-alt"></i>
              <span>Büyükyoncalı Mah. Atatürk Cad. No: 27/1B Saray Tekirdağ</span>
            </div>
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <span>530 465 04 14</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <i className="fas fa-phone"></i>
              <span>536 642 47 52</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <i className="fas fa-phone"></i>
              <span>532 063 73 62</span>
            </div>

          </div>
        </div>
      </div>

      {/* Admin Butonları - Sağ Tarafta Sabit Konumda */}
      {isAdmin && (
        <div className="admin-buttons-fixed">
          <button
            className="btn btn-secondary admin-btn-edit"
            onClick={() => handleEdit(listing)}
            disabled={deletingId === listing.ilan_no}
          >
            <i className="fas fa-edit"></i>
            <span>Düzenle</span>
          </button>
          <button
            className="btn btn-danger admin-btn-delete"
            onClick={() => handleDelete(listing.ilan_no)}
            disabled={deletingId === listing.ilan_no}
          >
            {deletingId === listing.ilan_no ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                <span>Siliniyor...</span>
              </>
            ) : (
              <>
                <i className="fas fa-trash"></i>
                <span>Sil</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="listing-detail-layout">
        {/* Sol Taraf - Fotoğraflar ve Açıklama */}
        <div className="listing-detail-photos">
          {photos.length > 0 ? (
            <>
              <div className="main-photo">
                <img
                  src={photos[currentImageIndex]}
                  alt={listing.baslik}
                  className={`main-photo-img ${
                    isPhotoChanging
                      ? (photoChangeDirection === 'left' ? 'change-photo-left' : 'change-photo-right')
                      : ''
                  }`}
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
                          setThumbnailPage(pageIndex);
                        }
                        setPhotoChangeDirection('left');
                        setIsPhotoChanging(true);
                        setTimeout(() => {
                          setIsPhotoChanging(false);
                          setPhotoChangeDirection(null);
                        }, 300);
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
                          setThumbnailPage(pageIndex);
                        }
                        setPhotoChangeDirection('right');
                        setIsPhotoChanging(true);
                        setTimeout(() => {
                          setIsPhotoChanging(false);
                          setPhotoChangeDirection(null);
                        }, 300);
                      }}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="photo-thumbnails-container">
                  {/* Üst kısım - x/y fotoğraf bilgisi, navigasyon okları ve noktalar aynı hizada */}
                  <div className="photo-thumbnails-header">
                    <div className="photo-info-left">
                      <span className="photo-counter">
                        {currentImageIndex + 1} / {photos.length} fotoğraf
                      </span>
                    </div>

                    {/* Navigasyon Okları ve Pagination Dots - x/y bilgisinin sağında, aynı hizada */}
                    {photos.length > thumbnailsPerPage && (
                      <div className="photo-navigation-compact" style={{ paddingLeft: '290px', paddingRight: '290px' }}>
                        <button
                          className="thumbnail-nav thumbnail-nav-prev"
                          onClick={() => {
                            if (thumbnailStartIndex > 0) {
                              const newStartIndex = Math.max(0, thumbnailStartIndex - thumbnailsPerPage);
                              setThumbnailStartIndex(newStartIndex);
                              setThumbnailPage(Math.floor(newStartIndex / thumbnailsPerPage));
                              setThumbnailSlideDirection('right');
                              setTimeout(() => setThumbnailSlideDirection(null), 300);
                            }
                          }}
                          style={{
                            visibility: 'visible',
                            opacity: thumbnailStartIndex > 0 ? 1 : 0.3,
                            pointerEvents: thumbnailStartIndex > 0 ? 'auto' : 'none'
                          }}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>

                        <div className="pagination-dots">
                          {Array.from({ length: Math.ceil(photos.length / thumbnailsPerPage) }, (_, i) => (
                            <button
                              key={i}
                              className={`pagination-dot ${i === thumbnailPage ? 'active' : ''}`}
                              onClick={() => {
                                const newStartIndex = i * thumbnailsPerPage;
                                const direction = newStartIndex > thumbnailStartIndex ? 'left' : 'right';
                                setThumbnailStartIndex(newStartIndex);
                                setThumbnailPage(i);
                                setThumbnailSlideDirection(direction);
                                setTimeout(() => setThumbnailSlideDirection(null), 300);
                              }}
                            />
                          ))}
                        </div>

                        <button
                          className="thumbnail-nav thumbnail-nav-next"
                          onClick={() => {
                            if (thumbnailStartIndex + thumbnailsPerPage < photos.length) {
                              const newStartIndex = thumbnailStartIndex + thumbnailsPerPage;
                              setThumbnailStartIndex(newStartIndex);
                              setThumbnailPage(Math.floor(newStartIndex / thumbnailsPerPage));
                              setThumbnailSlideDirection('left');
                              setTimeout(() => setThumbnailSlideDirection(null), 300);
                            }
                          }}
                          style={{
                            visibility: 'visible',
                            opacity: thumbnailStartIndex + thumbnailsPerPage < photos.length ? 1 : 0.3,
                            pointerEvents: thumbnailStartIndex + thumbnailsPerPage < photos.length ? 'auto' : 'none'
                          }}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail çubuğu - Sabit boyut */}
                  <div className="photo-thumbnails-wrapper">
                    <div className="photo-thumbnails">
                      {photos
                        .slice(thumbnailStartIndex, Math.min(thumbnailStartIndex + thumbnailsPerPage, photos.length))
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
          
          {/* İlan Sahibi Bilgileri - Fotoğrafların altında */}
          {isAdmin && (
            <div className="owner-card-container" style={{ marginTop: 'var(--spacing-lg)' }}>
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
                    <span style={{ fontWeight: 600 }}>Diğer bilgiler için tıklayın</span>
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
                      <span className="label"> Sahibi Adı:</span>
                      <span>{listing.sahibi_ad || 'Belirtilmemiş'}</span>
                    </div>

                    {/* Sağ üst - Sahibinden ilan no */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '2', gridRow: '1' }}>
                      <i className="fas fa-hashtag" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                      <span className="label"> Sahibinden No:</span>
                      <span>{listing.sahibinden_no || 'Belirtilmemiş'}</span>
                    </div>

                    {/* Sol alt - Sahibi tel */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '1', gridRow: '2' }}>
                      <i className="fas fa-phone" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                      <span className="label"> Sahibi Tel:</span>
                      <span>{listing.sahibi_tel || 'Belirtilmemiş'}</span>
                    </div>

                    {/* Sağ alt - Sahibinden tarih */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '2', gridRow: '2' }}>
                      <i className="fas fa-calendar" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                      <span className="label"> Sahibinden Tarih:</span>
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

        {/* Sağ Taraf - Bilgiler */}
        <div className="listing-detail-info">

          {/* Bilgiler - Üstte */}
          <div className="info-section">
            <div className="info-grid">
              {/* Fiyat */}
              <div className="info-item">
                <i className="fas fa-money-bill-wave"></i>
                <span className="label">Fiyat:</span>
                <span className="value">{listing.fiyat.toLocaleString('tr-TR')} TL</span>
              </div>

              {/* Konum */}
              <div className="info-item">
                <i className="fas fa-map-marker-alt"></i>
                <span className="label">Konum:</span>
                <span className="value">{[listing.il, listing.ilce, listing.mahalle].filter(Boolean).join(' / ') || 'Konum belirtilmemiş'}</span>
              </div>

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
                    <span className="value">{listing.aidat != null && listing.aidat > 0 ? `${listing.aidat} TL` : 'Belirtilmemiş'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Özellikler - Sadece konut tiplerinde göster */}
            {listing.emlak_tipi !== 'Arsa' && (
              <div className="features">
                {listing.balkon ? (
                  <span className="feature">
                    <i className="fas fa-check"></i>
                    Balkon var
                  </span>
                ) : (
                  <span className="feature">
                    <i className="fas fa-times"></i>
                    Balkon yok
                  </span>
                )}
                {listing.asansor ? (
                  <span className="feature">
                    <i className="fas fa-check"></i>
                    Asansör var
                  </span>
                ) : (
                  <span className="feature">
                    <i className="fas fa-times"></i>
                    Asansör yok
                  </span>
                )}
                {listing.esyali ? (
                  <span className="feature">
                    <i className="fas fa-check"></i>
                    Eşyalı
                  </span>
                ) : (
                  <span className="feature">
                    <i className="fas fa-times"></i>
                    Eşyasız
                  </span>
                )}
              </div>
            )}
          </div>

          {/* İlan Açıklaması - Bilgi bölümünün altında */}
          <div className="description-section" style={{ marginBottom: 'var(--spacing-md)' }}>
            <h3>İlan Açıklaması</h3>
            <div className="description-content">
              {listing.detay || 'Açıklama belirtilmemiş'}
            </div>
          </div>

          
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
              className={`photo-modal-img ${
                isPhotoChanging
                  ? (photoChangeDirection === 'left' ? 'change-photo-left' : 'change-photo-right')
                  : ''
              }`}
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
