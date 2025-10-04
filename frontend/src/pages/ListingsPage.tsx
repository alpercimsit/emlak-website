import { useEffect, useState, useMemo, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { supabase } from '../utils/api';
import ListingList from '../components/ListingList';
import FilterPanel, { FilterState } from '../components/FilterPanel';
import FilterModal from '../components/FilterModal';
import { ModalContext } from '../App';

export interface Listing {
  ilan_no: number;              // ilan_no int8 primary key
  ilan_tarihi: string;          // ilan_tarihi timestamp
  baslik?: string;              // baslik text (nullable)
  emlak_tipi: string;           // emlak_tipi text (required)
  fiyat: number;               // fiyat int8 (required)
  detay?: string;               // detay text (nullable)
  m2?: number;                  // m2 int8 (nullable)
  il?: string;                  // il text (nullable)
  ilce?: string;                // ilce text (nullable)
  mahalle?: string;             // mahalle text (nullable)
  sahibinden_no?: number;        // sahibinden_no int8 (nullable)
  sahibi_ad?: string;          // sahibi_ad text (nullable)
  sahibi_tel?: string;         // sahibi_tel text (nullable)
  sahibinden_tarih?: string;     // sahibinden_tarih date (nullable)
  ada?: number;                 // ada int8 (nullable)
  parsel?: number;              // parsel int8 (nullable)
  oda_sayisi?: string;           // oda_sayisi text (nullable)
  bina_yasi?: string;            // bina_yasi text (nullable)
  bulundugu_kat?: string;        // bulundugu_kat text (nullable)
  kat_sayisi?: number;           // kat_sayisi int8 (nullable)
  isitma?: string;              // isitma text (nullable)
  banyo_sayisi?: number;         // banyo_sayisi int8 (nullable)
  balkon?: boolean;             // balkon bool (nullable)
  asansor?: boolean;            // asansor bool (nullable)
  esyali?: boolean;             // esyali bool (nullable)
  aidat?: number;               // aidat int8 (nullable)
  fotolar?: string;             // fotolar text (nullable)
  gizli?: boolean;              // gizli bool - admin can hide listings (nullable)
  not?: string;                 // not text - admin only field (nullable)
}

function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Get modal context
  const modalContext = useContext(ModalContext);

  // Sıralama seçenekleri
  const [sortOption, setSortOption] = useState<'price-desc' | 'price-asc' | 'date-desc' | 'date-asc' | 'm2-desc' | 'm2-asc' | 'pricePerM2-desc' | 'pricePerM2-asc'>('date-desc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Mobil filtre modal state'i
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Pagination state'leri - URL'den oku
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const itemsPerPage = 12; // Her sayfada maksimum 12 ilan
  
  // Sıralama seçenekleri tanımı
  const sortOptions = [
    { key: 'price-desc' as const, label: 'Fiyata göre önce en yüksek' },
    { key: 'price-asc' as const, label: 'Fiyata göre önce en düşük' },
    { key: 'date-desc' as const, label: 'Tarihe göre önce en yeni' },
    { key: 'date-asc' as const, label: 'Tarihe göre önce en eski' },
    { key: 'm2-desc' as const, label: 'm²\'ye göre önce en yüksek' },
    { key: 'm2-asc' as const, label: 'm²\'ye göre önce en düşük' },
    { key: 'pricePerM2-desc' as const, label: 'TL/m² fiyatına göre önce en yüksek' },
    { key: 'pricePerM2-asc' as const, label: 'TL/m² fiyatına göre önce en düşük' }
  ];
  
  // Filtre state'i - localStorage'dan yükle veya default olarak arsa seçili
  const [filters, setFilters] = useState<FilterState>(() => {
    const savedFilters = localStorage.getItem('listingFilters');
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (error) {
        console.error('Kaydedilmiş filtreler yüklenirken hata:', error);
      }
    }
    return {
      category: 'arsa',
      subCategory: 'all',
      searchText: '',
      ilanNo: '',
      fiyatMin: '',
      fiyatMax: '',
      alanMin: '',
      alanMax: '',
      il: null,
      ilce: null,
      mahalle: null,
      adaNo: '',
      parselNo: '',
      binaYaslari: [],
      odaSayilari: [],
      katlar: [],
      balkon: '',
      asansor: '',
      esyali: '',
      sahibiAd: '',
      sahibiTel: '',
      sahibindenNo: '',
      sahibindenTarih: '',
      not: '',
      gizliIlanlar: ''
    };
  });

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
    
    setLoading(true);
    api.getListings()
      .then((data) => setListings(data))
      .catch((err) => console.error('İlanlar yüklenirken hata:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filtreleri localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('listingFilters', JSON.stringify(filters));
  }, [filters]);


  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSortDropdownOpen && !(event.target as Element).closest('.sort-dropdown')) {
        setIsSortDropdownOpen(false);
      }
    };

    if (isSortDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSortDropdownOpen]);



  // Filtrelenmiş ve sıralanmış ilanları hesapla
  const filteredListings = useMemo((): Listing[] => {
    console.log('Filtering listings:', {
      totalListings: listings.length,
      currentCategory: filters.category,
      currentSubCategory: filters.subCategory,
      filters
    });

    // Önce filtreleme yap
    const filtered = listings.filter(listing => {
      // Debug: Her ilan için emlak_tipi'ni logla
      console.log('Listing emlak_tipi:', listing.emlak_tipi, 'Filter category:', filters.category);

      // Kategori filtresi
      if (filters.category === 'arsa') {
        if (listing.emlak_tipi !== 'Arsa') return false;
      } else if (filters.category === 'konut') {
        if (filters.subCategory === 'satilik') {
          if (listing.emlak_tipi !== 'satilikDaire') return false;
        } else if (filters.subCategory === 'kiralik') {
          if (listing.emlak_tipi !== 'kiralikDaire') return false;
        } else {
          // 'all' - hem satılık hem kiralık
          if (!['satilikDaire', 'kiralikDaire'].includes(listing.emlak_tipi)) return false;
        }
      }

      // Metin arama
      if (filters.searchText) {
        const searchText = filters.searchText.toLowerCase();
        const searchableText = `${listing.baslik} ${listing.detay}`.toLowerCase();
        if (!searchableText.includes(searchText)) return false;
      }

      // İlan no arama
      if (filters.ilanNo) {
        if (!(listing.ilan_no.toString() === filters.ilanNo)) return false;
      }

      // Fiyat filtresi
      if (filters.fiyatMin && listing.fiyat < parseInt(filters.fiyatMin)) return false;
      if (filters.fiyatMax && listing.fiyat > parseInt(filters.fiyatMax)) return false;

      // Alan filtresi
      if (filters.alanMin && (!listing.m2 || listing.m2 < parseInt(filters.alanMin))) return false;
      if (filters.alanMax && (!listing.m2 || listing.m2 > parseInt(filters.alanMax))) return false;

      // Konum filtreleri
      if (filters.il) {
        if (!listing.il || !listing.il.toLowerCase().includes(filters.il.name.toLowerCase())) return false;
      }
      if (filters.ilce) {
        if (!listing.ilce || !listing.ilce.toLowerCase().includes(filters.ilce.name.toLowerCase())) return false;
      }
      if (filters.mahalle) {
        if (!listing.mahalle || !listing.mahalle.toLowerCase().includes(filters.mahalle.name.toLowerCase())) return false;
      }

      // Arsa özel filtreleri
      if (filters.category === 'arsa') {
        if (filters.adaNo && (!listing.ada || !(listing.ada.toString() === filters.adaNo))) return false;
        if (filters.parselNo && (!listing.parsel || !(listing.parsel.toString() === filters.parselNo))) return false;
      }

      // Konut özel filtreleri
      if (filters.category === 'konut') {
        // Bina yaşı filtresi
        if (filters.binaYaslari.length > 0 && (!listing.bina_yasi || !filters.binaYaslari.includes(listing.bina_yasi))) return false;

        // Oda sayısı filtresi
        if (filters.odaSayilari.length > 0 && (!listing.oda_sayisi || !filters.odaSayilari.includes(listing.oda_sayisi))) return false;

        // Kat filtresi
        if (filters.katlar.length > 0 && (listing.bulundugu_kat == null || !filters.katlar.includes(listing.bulundugu_kat))) return false;

        // Kiralık/Satılık konut özel filtreleri
        if (filters.category === 'konut') {
          // Balkon filtresi
          if (filters.balkon && filters.balkon !== 'Tümü') {
            const hasBalcony = listing.balkon === true;
            if (filters.balkon === 'Var' && !hasBalcony) return false;
            if (filters.balkon === 'Yok' && hasBalcony) return false;
          }

          // Asansör filtresi
          if (filters.asansor && filters.asansor !== 'Tümü') {
            const hasElevator = listing.asansor === true;
            if (filters.asansor === 'Var' && !hasElevator) return false;
            if (filters.asansor === 'Yok' && hasElevator) return false;
          }

          // Eşyalı filtresi
          if (filters.esyali && filters.esyali !== 'Tümü') {
            const isFurnished = listing.esyali === true;
            if (filters.esyali === 'Eşyalı' && !isFurnished) return false;
            if (filters.esyali === 'Eşyasız' && isFurnished) return false;
          }
        }
      }

      if(filters.sahibiAd) {
        if(!listing.sahibi_ad || !listing.sahibi_ad.toLowerCase().includes(filters.sahibiAd.toLowerCase())) return false;
      }
      if(filters.sahibiTel) {
        if(!listing.sahibi_tel || !listing.sahibi_tel.toLowerCase().includes(filters.sahibiTel.toLowerCase())) return false;
      }
      if(filters.sahibindenNo) {
        if(!listing.sahibinden_no || !(listing.sahibinden_no.toString() === filters.sahibindenNo)) return false;
      }
      if(filters.sahibindenTarih) {
        if(!listing.sahibinden_tarih || !listing.sahibinden_tarih.toLowerCase().includes(filters.sahibindenTarih.toLowerCase())) return false;
      }
      if(filters.not) {
        if(!listing.not || !listing.not.toLowerCase().includes(filters.not.toLowerCase())) return false;
      }
      if(filters.gizliIlanlar) {
        if(filters.gizliIlanlar === 'gizli' && !listing.gizli) return false;
        if(filters.gizliIlanlar === 'acik' && listing.gizli) return false;
      }

      return true;
    });

    // Sonra sıralama uygula
    const sortedListings: Listing[] = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'price-desc':
          return b.fiyat - a.fiyat;
        case 'price-asc':
          return a.fiyat - b.fiyat;
        case 'm2-desc':
          // m²'ye göre önce en yüksek (null değerler en sonda)
          if (!a.m2 && !b.m2) return 0;
          if (!a.m2) return 1;
          if (!b.m2) return -1;
          return b.m2 - a.m2;
        case 'm2-asc':
          // m²'ye göre önce en düşük (null değerler en sonda)
          if (!a.m2 && !b.m2) return 0;
          if (!a.m2) return 1;
          if (!b.m2) return -1;
          return a.m2 - b.m2;
        case 'pricePerM2-desc':
          // m²/TL fiyatına göre önce en yüksek (m² başına en pahalı, null değerler en sonda)
          if (!a.m2 && !b.m2) return 0;
          if (!a.m2) return 1;
          if (!b.m2) return -1;
          const pricePerM2A = a.fiyat / a.m2;
          const pricePerM2B = b.fiyat / b.m2;
          return pricePerM2B - pricePerM2A;
        case 'pricePerM2-asc':
          // m²/TL fiyatına göre önce en düşük (m² başına en ucuz, null değerler en sonda)
          if (!a.m2 && !b.m2) return 0;
          if (!a.m2) return 1;
          if (!b.m2) return -1;
          const pricePerM2A_asc = a.fiyat / a.m2;
          const pricePerM2B_asc = b.fiyat / b.m2;
          return pricePerM2A_asc - pricePerM2B_asc;
        case 'date-desc':
          return new Date(b.ilan_tarihi).getTime() - new Date(a.ilan_tarihi).getTime();
        case 'date-asc':
          return new Date(a.ilan_tarihi).getTime() - new Date(b.ilan_tarihi).getTime();
        default:
          return 0;
      }
    });

    return sortedListings;
  }, [listings, filters, sortOption]);

  // Pagination için mevcut sayfadaki ilanları al
  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredListings.slice(startIndex, endIndex);
  }, [filteredListings, currentPage, itemsPerPage]);

  // Toplam sayfa sayısı
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);

  // Sayfa değişikliği için fonksiyon
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    setSearchParams(params);
  };

  // Dinamik başlık metni oluşturma
  const getPageTitle = () => {
    if (filters.category === 'arsa') {
      return 'İlan Listesi - Arsa';
    } else if (filters.category === 'konut') {
      if (filters.subCategory === 'satilik') {
        return 'İlan Listesi - Satılık Konut';
      } else if (filters.subCategory === 'kiralik') {
        return 'İlan Listesi - Kiralık Konut';
      } else {
        return 'İlan Listesi - Konut';
      }
    }
    return 'İlan Listesi';
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-xl)' }}>
      {/* Ana başlık ve kontrol paneli */}
      <div className="listings-title-section">
        <h1 className="listings-page-title" style={{fontSize: '29px'}}>
          {getPageTitle()}
        </h1>

        {/* Sıralama ve bulunan kayıt sayısı - başlığın sağında */}
        <div className="listings-header" style={{ position: 'relative', zIndex: 10 }}>
          <div className="listings-sort-section">
            <div className="sort-dropdown">
              <button
                id="sort-button"
                className="sort-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsSortDropdownOpen(!isSortDropdownOpen);
              }}
              >
                <i className="fas fa-sort"></i>
                Sırala
                <i className={`fas fa-chevron-down ${isSortDropdownOpen ? 'rotate' : ''}`}></i>
              </button>
              <div className={`sort-dropdown-menu ${isSortDropdownOpen ? 'show' : ''}`}>
                {sortOptions.map(option => (
                  <div
                    key={option.key}
                    className={`sort-option ${sortOption === option.key ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortOption(option.key);
                      setIsSortDropdownOpen(false);
                    }}
                  >
                    {option.label}
                    {sortOption === option.key && <i className="fas fa-check"></i>}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobil Filtre Butonu - Sadece mobil görünümde göster */}
            <button
              className="filter-button-mobile"
              onClick={() => setIsFilterModalOpen(!isFilterModalOpen)}
              style={{
                display: 'none',
                marginLeft: 'var(--spacing-sm)',
                marginBottom: 'calc(var(--spacing-lg) / 1.2)',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              <i className="fas fa-filter"></i> &nbsp;
              Filtrele
            </button>
          </div>
          <div className="listings-count">
            Bulunan İlan:&nbsp; <strong>{filteredListings.length}</strong>
          </div>
        </div>
      </div>

      {/* Başlık ile ilanlar arasına ayırıcı çizgi */}
      <hr className="listings-separator" style={{ width: '100%', border: 'none', height: '2px', backgroundColor: 'var(--border-color)', margin: '1.5rem 0 2rem 0' }} />

      <div className="listings-container">
        <div className="listings-layout">
          {/* Sol taraf - Filtre Paneli */}
          <div className="filter-sidebar">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={filteredListings.length}
              isAdmin={isAdmin}
            />
          </div>

          {/* Sağ taraf - İlan Listesi */}
          <div className="listings-content">
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <span style={{ marginLeft: 'var(--spacing-sm)' }}>İlanlar yükleniyor...</span>
              </div>
            ) : (
              <ListingList
                listings={paginatedListings}
                isAdmin={isAdmin}
                onUpdate={() => window.location.reload()}
                onEditListing={modalContext.onEditListing}
              />
            )}
          </div>
        </div>

        {/* Pagination Kontrolleri */}
        {totalPages > 1 && (
          <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-lg)' }}>
            {/* Önceki Sayfa Butonu */}
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: currentPage === 1 ? 'var(--background-color)' : 'var(--surface-color)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-color)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              «
            </button>

            {/* Sayfa Numaraları */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {(() => {
                const pages = [];
                const showPages = 8; // Maksimum gösterilecek sayfa sayısı
                let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                let endPage = Math.min(totalPages, startPage + showPages - 1);

                // Eğer son sayfa gösteriliyorsa, başlangıç sayfasını ayarla
                if (endPage - startPage + 1 < showPages) {
                  startPage = Math.max(1, endPage - showPages + 1);
                }

                // İlk sayfa her zaman göster
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      className="pagination-btn"
                      onClick={() => handlePageChange(1)}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 1 === currentPage ? 'var(--primary-color)' : 'var(--surface-color)',
                        color: 1 === currentPage ? 'white' : 'var(--text-color)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minWidth: '36px'
                      }}
                    >
                      1
                    </button>
                  );

                  if (startPage > 2) {
                    pages.push(
                      <span key="start-ellipsis" style={{ margin: '0 var(--spacing-xs)', color: 'var(--text-muted)' }}>
                        ...
                      </span>
                    );
                  }
                }

                // Sayfa numaralarını ekle
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      className="pagination-btn"
                      onClick={() => handlePageChange(i)}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: i === currentPage ? 'var(--primary-color)' : 'var(--surface-color)',
                        color: i === currentPage ? 'white' : 'var(--text-color)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minWidth: '36px'
                      }}
                    >
                      {i}
                    </button>
                  );
                }

                // Son sayfa her zaman göster
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="end-ellipsis" style={{ margin: '0 var(--spacing-xs)', color: 'var(--text-muted)' }}>
                        ...
                      </span>
                    );
                  }

                  pages.push(
                    <button
                      key={totalPages}
                      className="pagination-btn"
                      onClick={() => handlePageChange(totalPages)}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: totalPages === currentPage ? 'var(--primary-color)' : 'var(--surface-color)',
                        color: totalPages === currentPage ? 'white' : 'var(--text-color)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minWidth: '36px'
                      }}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}
            </div>

            {/* Sonraki Sayfa Butonu */}
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: currentPage === totalPages ? 'var(--background-color)' : 'var(--surface-color)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-color)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              »
            </button>
          </div>
        )}

        {/* Mobil Filtre Modal */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={filteredListings.length}
          isAdmin={isAdmin}
        />
      </div>

    </div>
  );
}

export default ListingsPage;

