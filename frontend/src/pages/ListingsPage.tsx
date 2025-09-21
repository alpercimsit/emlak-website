import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ListingList from '../components/ListingList';
import FilterPanel, { FilterState } from '../components/FilterPanel';

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
  bulundugu_kat?: number;        // bulundugu_kat int8 (nullable)
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
  const navigate = useNavigate();

  // Sıralama seçenekleri
  const [sortOption, setSortOption] = useState<'price-desc' | 'price-asc' | 'date-desc' | 'date-asc'>('date-desc');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Sıralama seçenekleri tanımı
  const sortOptions = [
    { key: 'price-desc' as const, label: 'Fiyata göre önce en yüksek' },
    { key: 'price-asc' as const, label: 'Fiyata göre önce en düşük' },
    { key: 'date-desc' as const, label: 'Tarihe göre önce en yeni' },
    { key: 'date-asc' as const, label: 'Tarihe göre önce en eski' }
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
      il: '',
      ilce: '',
      mahalle: '',
      adaNo: '',
      parselNo: '',
      binaYaslari: [],
      odaSayilari: [],
      katlar: []
    };
  });

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('adminToken');
    setIsAdmin(token && token.startsWith('admin-token-') ? true : false);
    
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
        if (!listing.ilan_no.toString().includes(filters.ilanNo)) return false;
      }

      // Fiyat filtresi
      if (filters.fiyatMin && listing.fiyat < parseInt(filters.fiyatMin)) return false;
      if (filters.fiyatMax && listing.fiyat > parseInt(filters.fiyatMax)) return false;

      // Alan filtresi
      if (filters.alanMin && listing.m2 && listing.m2 < parseInt(filters.alanMin)) return false;
      if (filters.alanMax && listing.m2 && listing.m2 > parseInt(filters.alanMax)) return false;

      // Konum filtreleri
      if (filters.il && listing.il && !listing.il.toLowerCase().includes(filters.il.name.toLowerCase())) return false;
      if (filters.ilce && listing.ilce && !listing.ilce.toLowerCase().includes(filters.ilce.name.toLowerCase())) return false;
      if (filters.mahalle && listing.mahalle && !listing.mahalle.toLowerCase().includes(filters.mahalle.name.toLowerCase())) return false;

      // Arsa özel filtreleri
      if (filters.category === 'arsa') {
        if (filters.adaNo && !listing.ada?.toString().includes(filters.adaNo)) return false;
        if (filters.parselNo && !listing.parsel?.toString().includes(filters.parselNo)) return false;
      }

      // Konut özel filtreleri
      if (filters.category === 'konut') {
        // Bina yaşı filtresi
        if (filters.binaYaslari.length > 0 && listing.bina_yasi && !filters.binaYaslari.includes(listing.bina_yasi)) return false;

        // Oda sayısı filtresi
        if (filters.odaSayilari.length > 0 && listing.oda_sayisi && !filters.odaSayilari.includes(listing.oda_sayisi)) return false;

        // Kat filtresi
        if (filters.katlar.length > 0 && listing.bulundugu_kat != null) {
          const kat = listing.bulundugu_kat.toString();
          const katStr = kat === '0' ? 'Zemin' : kat === '-1' ? 'Bodrum' :
                        parseInt(kat) >= 10 ? '10+' : kat;
          if (!filters.katlar.includes(katStr)) return false;
        }
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
        <h1 className="listings-page-title">
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
          </div>
          <div className="listings-count">
            Bulunan Kayıt: <strong>{filteredListings.length}</strong>
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
                listings={filteredListings}
                isAdmin={isAdmin}
                onUpdate={() => window.location.reload()}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default ListingsPage;

