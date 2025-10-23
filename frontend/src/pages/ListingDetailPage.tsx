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
  const [thumbnailSlideDirection, setThumbnailSlideDirection] = useState<'left' | 'right' | null>(null);

  // Touch/swipe gesture state'leri
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [modalTranslateX, setModalTranslateX] = useState(0);

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
          // Update page title when listing is loaded
          updatePageTitle(data);
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

  // Fotoğraf modal için geri tuşu dinleme ve hash fragment kontrolü
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash === '#photo-modal') {
        setShowPhotoModal(true);
      } else {
        setShowPhotoModal(false);
      }
    };
  
    window.addEventListener('popstate', handlePopState);
    handlePopState(); // ilk yüklemede kontrol et
  
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [id]);


  // Emlak tipi görüntüleme için helper fonksiyon
  const formatEmlakTipi = (emlakTipi: string) => {
    switch (emlakTipi) {
      case 'kiralikDaire':
        return 'Kiralık Daire';
      case 'satilikDaire':
        return 'Satılık Daire';
      case 'Arsa':
        return 'Arsa';
      case 'Tarla':
        return 'Tarla';
      case 'bagYeri':
        return 'Bağ Yeri';
      case 'Hisse':
        return 'Hisse';
      case 'Daire':
        return 'Daire';
      default:
        return emlakTipi;
    }
  };

  // Büyük ünlü uyumu için ek fonksiyonu
  const getLocationSuffix = (location: string) => {
    const lastChar = location.charAt(location.length - 1).toLowerCase();
    let sertUnsuz = false;
    if(lastChar === 'f' || lastChar === 's' || lastChar === 't' || lastChar === 'k' || lastChar === 'ç'
       || lastChar === 'ş' || lastChar === 'h' || lastChar === 'p'){
      sertUnsuz = true;
    }

    for(let i = location.length -1; i > 0; i--){
      const char = location.charAt(i).toLowerCase();
      if (char === 'a' || char === 'ı' || char === 'o' || char === 'u') {
        if(sertUnsuz){
          return "'ta";
        }
        return "'da";
      } else if (char === 'e' || char === 'i' || char === 'ö' || char === 'ü') {
        if(sertUnsuz){
          return "'te";
        }
        return "'de";
      }
    }

    // Eğer Türkçe karakter değilse veya belirlenemezse varsayılan olarak 'da' kullan
    return "'de";
  };

  // Sayfa başlığını güncelleyen fonksiyon
  const updatePageTitle = (listing: Listing) => {
    if (!listing) return;

    // Konum bilgilerini birleştir (il, ilçe, mahalle)
    const locationParts = [listing.il, listing.ilce, listing.mahalle].filter(Boolean);

    if (locationParts.length === 0) {
      document.title = `${formatEmlakTipi(listing.emlak_tipi)} | Öz Kafkas Emlak`;
      return;
    }

    // Son konum bilgisi için ek al
    const lastLocation = locationParts[locationParts.length - 1];
    const suffix = lastLocation ? getLocationSuffix(lastLocation) : "'de";

    // Tam konum metnini oluştur
    const fullLocation = locationParts.join(', ');

    // Emlak tipi kontrolü
    let emlakTipiText = '';
    if (listing.emlak_tipi === 'Arsa') {
      emlakTipiText = 'Arsa';
    } else if (listing.emlak_tipi === 'Tarla') {
      emlakTipiText = 'Tarla';
    } else if (listing.emlak_tipi === 'bagYeri') {
      emlakTipiText = 'Bağ Yeri';
    } else if (listing.emlak_tipi === 'Hisse') {
      emlakTipiText = 'Hisse';
    } else if (listing.emlak_tipi === 'satilikDaire') {
      emlakTipiText = 'Satılık Daire';
    } else if (listing.emlak_tipi === 'kiralikDaire') {
      emlakTipiText = 'Kiralık Daire';
    } else {
      emlakTipiText = formatEmlakTipi(listing.emlak_tipi);
    }

    // m² bilgisi varsa ekle
    let areaText = '';
    if (listing.m2) {
      areaText = ` ${listing.m2} m²`;
    }

    // Başlığı oluştur
    const title = `${fullLocation}${suffix} ${emlakTipiText}${areaText} | Öz Kafkas Emlak`;
    document.title = title;
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
    setModalTranslateX(0); // Modal açıldığında translateX'i sıfırla
    // Modal açıldığında hash fragment ile yeni history entry oluştur
    window.history.pushState({ modalOpen: true, listingId: id }, '', '#photo-modal');
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
    // Modal kapandığında hash fragment'ı kaldır
    window.history.back();
  };

  const handleShare = async () => {
    if (!listing) return;

    const shareUrl = window.location.href;
    const shareTitle = listing.baslik || 'Emlak İlanı';
    let shareText = `Bu ilana göz atın: ${shareTitle} - ${listing.fiyat.toLocaleString('tr-TR')} TL`;
    if(['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi)){
      shareText = `Bu arsa ilanına göz atın: ${shareTitle} - ${listing.fiyat.toLocaleString('tr-TR')} TL`;
    }
    else{
      shareText = `Bu konut ilanına göz atın: ${shareTitle} - ${listing.fiyat.toLocaleString('tr-TR')} TL`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        const err = error as { name?: string };
        if (err.name !== 'AbortError') {
          console.error('Paylaşma hatası:', error);
          fallbackShare(shareUrl);
        }
      }
    } else {
      fallbackShare(shareUrl);
    }
  };

  const fallbackShare = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // Basit bir toast notification göstermek için
      showNotification('İlan linki panoya kopyalandı!');
    } catch (error) {
      console.error('Kopyalama hatası:', error);
      // Fallback için seç ve kopyala metodu
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showNotification('İlan linki panoya kopyalandı!');
      } catch (err) {
        console.error('Fallback kopyalama hatası:', err);
        alert('Link kopyalanamadı: ' + url);
      }
      document.body.removeChild(textArea);
    }
  };

  const showNotification = (message: string) => {
    // Basit bir notification elementi oluştur
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-color, #28a745);
      color: white;
      padding: 12px 20px;
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Animasyon için CSS ekle
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // 3 saniye sonra notification'ı kaldır
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const handlePhotoModalNav = (direction: 'prev' | 'next') => {
    handleChangePhoto(direction);
  };

  // Touch event handlers for mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (photos.length <= 1) return;

    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setTouchStartTime(Date.now());
    setIsSwiping(true);
    setIsDragging(true);
    setCurrentTranslateX(0);
    setModalTranslateX(0); // Modal için de sıfırla
    setVelocity(0);
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY || !isSwiping || photos.length <= 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - (touchStartX || 0);
    const deltaY = touch.clientY - (touchStartY || 0);

    // Eğer dikey hareket çok fazla ise (yatay hareketten daha fazla ise), swipe olarak kabul etme
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    // Minimum hareket gerektir
    if (Math.abs(deltaX) < 10) return;

    // Fotoğrafın maksimum hareket mesafesi (ekran genişliğinin %80'i)
    const maxTranslate = window.innerWidth * 0.8;
    const clampedDeltaX = Math.max(-maxTranslate, Math.min(maxTranslate, deltaX));

    setCurrentTranslateX(clampedDeltaX);
    setModalTranslateX(clampedDeltaX); // Modal için de güncelle

    // Hız hesapla (son 100ms'deki hareket)
    if (touchStartTime) {
      const currentTime = Date.now();
      const timeDiff = currentTime - touchStartTime;
      if (timeDiff > 0) {
        setVelocity(deltaX / timeDiff);
      }
    }

    e.preventDefault();
  };

  // YENİ BİRLEŞTİRİLMİŞ FONKSİYON
  const handleChangePhoto = (direction: 'prev' | 'next') => {
    const photos = listing?.fotolar ? listing.fotolar.split(',').filter(url => url.trim()) : [];
    if (photos.length <= 1) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex === 0 ? photos.length - 1 : currentImageIndex - 1;
    } else {
      newIndex = currentImageIndex === photos.length - 1 ? 0 : currentImageIndex + 1;
    }

    // --- Burası handleTouchEnd'den kopyaladığımız animasyon mantığı ---

    // 1. CSS transition'ı etkinleştir
    setIsDragging(false);

    // 2. Fotoğrafı ekranın dışına it (CSS transition'ı bunu yumuşak yapacak)
    const snapTarget = direction === 'prev' ? window.innerWidth : -window.innerWidth;
    setCurrentTranslateX(snapTarget);
    setModalTranslateX(snapTarget); // Modal için de aynısını yap

    // 3. Animasyon bittikten sonra state'i toparla
    setTimeout(() => {
      // 4. Toparlama yaparken animasyon olmasın diye transition'ı geçici olarak kapat
      setIsDragging(true); 

      // 5. Yeni indeksi ayarla
      setCurrentImageIndex(newIndex);
      
      // 6. Thumbnail'ları ayarla
      const pageIndex = Math.floor(newIndex / thumbnailsPerPage);
      const newStartIndex = pageIndex * thumbnailsPerPage;
      if (newStartIndex !== thumbnailStartIndex) {
        setThumbnailStartIndex(newStartIndex);
        setThumbnailPage(pageIndex);
      }

      // 7. Translate'i sıfırla (yeni fotoğraf artık ortada)
      setCurrentTranslateX(0);
      setModalTranslateX(0);

      // 8. Bir sonraki karede transition'ları tekrar aç
      requestAnimationFrame(() => {
        setIsDragging(false);
      });

    }, 350); // CSS'deki transition süren 0.3s-0.35s arası. 350 ideal.
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX || !isSwiping || photos.length <= 1) {
      setTouchStartX(null);
      setTouchStartY(null);
      setTouchStartTime(null);
      setIsSwiping(false);
      setIsDragging(false);
      setCurrentTranslateX(0);
      setModalTranslateX(0);
      setVelocity(0);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - (touchStartX || 0);
    const deltaY = touch.clientY - (touchStartY || 0);

    // Dikey kaydırmayı iptal et
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setTouchStartX(null);
      setTouchStartY(null);
      setTouchStartTime(null);
      setIsSwiping(false);
      setIsDragging(false);
      setCurrentTranslateX(0); // Geri sek
      setModalTranslateX(0);
      setVelocity(0);
      return;
    }

    const threshold = window.innerWidth * 0.2; 
    const minVelocity = 0.5;

    // Eğer yeterli hareket veya hız yoksa, fotoğrafı geri getir (Snap-back)
    if (Math.abs(deltaX) < threshold && Math.abs(velocity) < minVelocity) {
      setTouchStartX(null);
      setTouchStartY(null);
      setTouchStartTime(null);
      setIsSwiping(false);
      setIsDragging(false);
      setCurrentTranslateX(0); // Geri sek (transition bunu yumuşak yapacak)
      setModalTranslateX(0);
      setVelocity(0);
      return;
    }

    // Buraya geldiyse, fotoğraf değişecek demektir.
    let direction: 'prev' | 'next' = 'next'; // Yönü 'prev'/'next' olarak değiştirdik
    if (deltaX > 0 || velocity > 0) {
      direction = 'prev'; // Önceki fotoğraf
    } else {
      direction = 'next'; // Sonraki fotoğraf
    }

    handleChangePhoto(direction);

    // 9. Touch state'lerini hemen sıfırla.
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchStartTime(null);
    setIsSwiping(false);
    setVelocity(0);
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
    <div className = 'listing-detail-whole-page' style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)', position: 'relative' }}>

      <div className="container">

      {/* Mobil İlan Başlığı - Sadece mobil görünümde göster */}
      <div className="mobile-listing-title">
        <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
          {listing.baslik || 'Başlık belirtilmemiş'}
        </h1>
      </div>

      {/* Desktop İlan Başlığı ve İletişim - Sadece desktop görünümde göster */}
      <div className="desktop-listing-header">
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

      {/* Mobil İlan İçeriği - Sadece mobil görünümde göster */}
      <div className="mobile-listing-content">
        {/* Fotoğraflar */}
        <div className="mobile-listing-photos">
          {photos.length > 0 ? (
            <>
              <div className="main-photo">
                <div className="carousel-container">
                  {photos.length > 0 && (
                    <>
                      {/* Önceki fotoğraf */}
                      <img
                        key="prev-photo-slot"
                        src={photos[(currentImageIndex - 1 + photos.length) % photos.length]}
                        alt={`${listing.baslik} - Önceki`}
                        className="carousel-img"
                        style={{
                          transform: `translateX(${currentTranslateX - window.innerWidth}px)`,
                          transition: isDragging ? 'none' : 'transform 0.3s ease'
                        }}
                      />

                      {/* Mevcut fotoğraf */}
                      <img
                        key="current-photo-slot"
                        src={photos[currentImageIndex]}
                        alt={listing.baslik}
                        className={"carousel-img"}
                        style={{
                          transform: `translateX(${currentTranslateX}px)`,
                          transition: isDragging ? 'none' : 'transform 0.3s ease',
                        }}
                        onClick={handlePhotoClick}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      />

                      {/* Sonraki fotoğraf */}
                      <img
                        key="next-photo-slot"
                        src={photos[(currentImageIndex + 1) % photos.length]}
                        alt={`${listing.baslik} - Sonraki`}
                        className="carousel-img"
                        style={{
                          transform: `translateX(${currentTranslateX + window.innerWidth}px)`,
                          transition: isDragging ? 'none' : 'transform 0.3s ease'
                        }}
                      />
                    </>
                  )}
                </div>
                <button
                  className="share-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  title="İlanı paylaş"
                >
                  <i className="fas fa-share-alt"></i>
                </button>
                {photos.length > 1 && (
                  <>
                    <button
                      className="photo-nav photo-nav-prev"
                      onClick={() => {
                        handleChangePhoto('prev');
                      }}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <button
                      className="photo-nav photo-nav-next"
                      onClick={() => {
                        handleChangePhoto('next');
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
                    <div className="photo-info-left">
                      <span className="photo-counter">
                        {currentImageIndex + 1} / {photos.length} fotoğraf
                      </span>
                    </div>

                    {photos.length > thumbnailsPerPage && (
                      <div className="photo-navigation-compact" style={{ paddingLeft: 'var(--spacing-sm)', paddingRight: 'var(--spacing-sm)' }}>
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
        </div>

        {/* İlan Sahibi Bilgileri - Fotoğrafların altında, sadece admin için */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '1', gridRow: '1' }}>
                    <i className="fas fa-user" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                    <span className="label"> Sahibi Adı:</span>
                    <span>{listing.sahibi_ad || 'Belirtilmemiş'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '2', gridRow: '1' }}>
                    <i className="fas fa-hashtag" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                    <span className="label"> Sahibinden No:</span>
                    <span>{listing.sahibinden_no || 'Belirtilmemiş'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '1', gridRow: '2' }}>
                    <i className="fas fa-phone" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                    <span className="label"> Sahibi Tel:</span>
                    <span>{listing.sahibi_tel || 'Belirtilmemiş'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '2', gridRow: '2' }}>
                    <i className="fas fa-calendar" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                    <span className="label"> Sahibinden Tarih:</span>
                    <span>{listing.sahibinden_tarih ? new Date(listing.sahibinden_tarih).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.8rem', gridColumn: '1 / 3', gridRow: '3', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-xs)' }}>
                    <i className="fas fa-sticky-note" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                    <span style={{ wordBreak: 'break-word' }}>{listing.not || 'Not yok'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bilgiler */}
        <div className="mobile-listing-info">
          <div className="info-section">
            <div className="info-grid">
              <div className="info-item">
                <i className="fas fa-money-bill-wave"></i>
                <span className="label">Fiyat:</span>
                <span className="value">{listing.fiyat.toLocaleString('tr-TR')} TL</span>
              </div>

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

              {['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
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
              {['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
                <div className="info-item">
                  <i className="fas fa-map"></i>
                  <span className="label">Ada No:</span>
                  <span className="value">{listing.ada || 'Belirtilmemiş'}</span>
                </div>
              )}
              {['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
                <div className="info-item">
                  <i className="fas fa-map-pin"></i>
                  <span className="label">Parsel No:</span>
                  <span className="value">{listing.parsel || 'Belirtilmemiş'}</span>
                </div>
              )}

              {!['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
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

            {!['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
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
        </div>

        {/* Açıklama */}
        <div className="mobile-listing-description">
          <div className="description-section">
            <h3 style={{ fontSize: '20px', marginTop: '7px'}}>İlan Açıklaması</h3>
            <div className="description-content">
              {listing.detay || 'Açıklama belirtilmemiş'}
            </div>
          </div>
        </div>
        
        {/* İletişim Kutusu - Mobil için en altta */}
        <div className="mobile-contact-section">
          <div
            className="contact-section contact-header contact-large"
            style={{ backgroundColor: 'var(--bg-primary)', width: '100%' }}
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
              <div className="contact-item mobile-phone-contact-numbers">
                <i className="fas fa-phone"></i>
                <span>530 465 04 14</span>
                &nbsp;&nbsp;&nbsp;
                <i className="fas fa-phone"></i>
                <span>536 642 47 52</span>
                &nbsp;&nbsp;&nbsp;
                <i className="fas fa-phone"></i>
                <span>532 063 73 62</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop İlan İçeriği - Sadece desktop görünümde göster */}
      <div className="desktop-listing-content">
        <div className="listing-detail-layout">
          <div className="listing-detail-photos">
            {photos.length > 0 ? (
              <>
                <div className="main-photo">
                  <div className="carousel-container">
                    {photos.length > 0 && (
                      <>
                        {/* Önceki fotoğraf */}
                        <img
                          key="prev-photo-slot"
                          src={photos[(currentImageIndex - 1 + photos.length) % photos.length]}
                          alt={`${listing.baslik} - Önceki`}
                          className="carousel-img"
                          style={{
                            transform: `translateX(${currentTranslateX - window.innerWidth}px)`,
                            transition: isDragging ? 'none' : 'transform 0.3s ease'
                          }}
                        />

                        {/* Mevcut fotoğraf */}
                        <img
                          key="current-photo-slot"
                          src={photos[currentImageIndex]}
                          alt={listing.baslik}
                          className={"carousel-img"}
                          style={{
                            transform: `translateX(${currentTranslateX}px)`,
                            transition: isDragging ? 'none' : 'transform 0.3s ease',
                          }}
                          onClick={handlePhotoClick}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        />

                        {/* Sonraki fotoğraf */}
                        <img
                          key="next-photo-slot"
                          src={photos[(currentImageIndex + 1) % photos.length]}
                          alt={`${listing.baslik} - Sonraki`}
                          className="carousel-img"
                          style={{
                            transform: `translateX(${currentTranslateX + window.innerWidth}px)`,
                            transition: isDragging ? 'none' : 'transform 0.3s ease'
                          }}
                        />
                      </>
                    )}
                  </div>
                  <button
                    className="share-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                    title="İlanı paylaş"
                  >
                    <i className="fas fa-share-alt"></i>
                  </button>
                  {photos.length > 1 && (
                    <>
                      <button
                        className="photo-nav photo-nav-prev"
                        onClick={() => {
                          handleChangePhoto('prev');
                        }}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button
                        className="photo-nav photo-nav-next"
                        onClick={() => {
                          handleChangePhoto('next');
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
                      <div className="photo-info-left">
                        <span className="photo-counter">
                          {currentImageIndex + 1} / {photos.length} fotoğraf
                        </span>
                      </div>

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '1', gridRow: '1' }}>
                        <i className="fas fa-user" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                        <span className="label"> Sahibi Adı:</span>
                        <span>{listing.sahibi_ad || 'Belirtilmemiş'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '2', gridRow: '1' }}>
                        <i className="fas fa-hashtag" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                        <span className="label"> Sahibinden No:</span>
                        <span>{listing.sahibinden_no || 'Belirtilmemiş'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '1', gridRow: '2' }}>
                        <i className="fas fa-phone" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                        <span className="label"> Sahibi Tel:</span>
                        <span>{listing.sahibi_tel || 'Belirtilmemiş'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: '0.85rem', gridColumn: '2', gridRow: '2' }}>
                        <i className="fas fa-calendar" style={{ color: 'var(--primary-color)', width: '12px' }}></i>
                        <span className="label"> Sahibinden Tarih:</span>
                        <span>{listing.sahibinden_tarih ? new Date(listing.sahibinden_tarih).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
                      </div>

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

          <div className="listing-detail-info">
            <div className="info-section">
              <div className="info-grid">
                <div className="info-item">
                  <i className="fas fa-money-bill-wave"></i>
                  <span className="label">Fiyat:</span>
                  <span className="value">{listing.fiyat.toLocaleString('tr-TR')} TL</span>
                </div>

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

                {['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
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
                {['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
                  <div className="info-item">
                    <i className="fas fa-map"></i>
                    <span className="label">Ada No:</span>
                    <span className="value">{listing.ada || 'Belirtilmemiş'}</span>
                  </div>
                )}
                {['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
                  <div className="info-item">
                    <i className="fas fa-map-pin"></i>
                    <span className="label">Parsel No:</span>
                    <span className="value">{listing.parsel || 'Belirtilmemiş'}</span>
                  </div>
                )}

                {!['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
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

              {!['Arsa', 'Tarla', 'bagYeri', 'Hisse'].includes(listing.emlak_tipi) && (
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

            <div className="description-section" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h3 style={{ fontSize: '20px' }}>İlan Açıklaması</h3>
              <div className="description-content">
                {listing.detay || 'Açıklama belirtilmemiş'}
              </div>
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
        <div
          className="photo-modal"
          onClick={handleClosePhotoModal}
          onTouchStart={(e) => {
            // Modal'da swipe hareketi varsa, modal kapanmasın diye touch start'ı engelle
            if (photos.length <= 1) return;
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            // Modal'da swipe hareketi varsa, modal kapanmasın diye touch move'u engelle
            if (photos.length <= 1) return;
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            // Modal'da swipe hareketi varsa, modal kapanmasın diye touch end'i engelle
            if (photos.length <= 1) return;
            e.stopPropagation();
          }}
        >
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="photo-modal-close"
              onClick={handleClosePhotoModal}
            >
              <i className="fas fa-times"></i>
            </button>
            
            {photos.length > 0 && (
              <div className="carousel-container">
                {/* Önceki fotoğraf - Modal'da sadece mevcut fotoğraf görünür */}
                <img
                  key="modal-prev-photo-slot"
                  src={photos[(currentImageIndex - 1 + photos.length) % photos.length]}
                  alt={`${listing.baslik} - Önceki`}
                  className="carousel-img"
                  style={{
                    transform: `translateX(${modalTranslateX - window.innerWidth}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease'
                  }}
                />

                <img
                  key="modal-next-photo-slot"
                  src={photos[(currentImageIndex + 1) % photos.length]}
                  alt={`${listing.baslik} - Sonraki`}
                  className="carousel-img"
                  style={{
                    transform: `translateX(${modalTranslateX + window.innerWidth}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease'
                  }}
                />

                {/* Mevcut fotoğraf */}
                <img
                  key="modal-current-photo-slot"
                  src={photos[currentImageIndex]}
                  alt={`${listing.baslik} - ${currentImageIndex + 1}`}
                  className={"carousel-img"}
                  style={{
                    transform: `translateX(${modalTranslateX}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
            )}
            
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
