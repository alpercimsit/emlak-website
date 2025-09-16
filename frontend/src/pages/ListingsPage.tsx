import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ListingList from '../components/ListingList';

export interface Listing {
  ilan_no: number;              // ilan_no int8 primary key
  ilan_tarihi: string;          // ilan_tarihi timestamp
  baslik: string;              // baslik text
  emlak_tipi: string;           // emlak_tipi text
  fiyat: number;               // fiyat int8
  detay: string;               // detay text
  m2: number;                  // m2 int8
  il: string;                  // il text
  ilce: string;                // ilce text
  mahalle: string;             // mahalle text
  sahibinden_no: number;        // sahibinden_no int8
  sahibi_ad?: string;          // sahibi_ad text (optional for non-admin users)
  sahibi_tel?: string;         // sahibi_tel text (optional for non-admin users)
  sahibinden_tarih: string;     // sahibinden_tarih date
  ada: number;                 // ada int8
  parsel: number;              // parsel int8
  oda_sayisi: string;           // oda_sayisi text
  bina_yasi: string;            // bina_yasi text
  bulundugu_kat: number;        // bulundugu_kat int8
  kat_sayisi: number;           // kat_sayisi int8
  isitma: string;              // isitma text
  banyo_sayisi: number;         // banyo_sayisi int8
  balkon: boolean;             // balkon bool
  asansor: boolean;            // asansor bool
  esyali: boolean;             // esyali bool
  aidat: number;               // aidat int8
  fotolar: string;             // fotolar text
  gizli: boolean;              // gizli bool - admin can hide listings
}

function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

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

  const handleNewListing = () => {
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    // Refresh the page to reload listings without admin privileges
    window.location.reload();
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
      <div className="d-flex justify-between align-center mb-4">
        <h1 className="text-center mb-4">
          <i className="fas fa-home" style={{ marginRight: 'var(--spacing-sm)', color: 'var(--primary-color)' }}></i>
          Emlak İlanları {isAdmin && <span style={{ fontSize: '0.7em', color: 'var(--success-color)' }}>(Admin Modu)</span>}
        </h1>
        
        {isAdmin && (
          <div className="d-flex gap-2">
            <button
              onClick={handleNewListing}
              className="btn btn-primary"
              style={{ marginTop: '0' }}
            >
              <i className="fas fa-plus" style={{ marginRight: 'var(--spacing-sm)' }}></i>
              Yeni İlan Ekle
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ marginTop: '0' }}
            >
              <i className="fas fa-sign-out-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
              Admin Çıkış
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span style={{ marginLeft: 'var(--spacing-sm)' }}>İlanlar yükleniyor...</span>
        </div>
      ) : (
        <ListingList listings={listings} isAdmin={isAdmin} onUpdate={() => window.location.reload()} />
      )}
    </div>
  );
}

export default ListingsPage;

