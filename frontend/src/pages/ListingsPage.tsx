import { useEffect, useState } from 'react';
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
  isitma: string;              // isitma text (note: table has 'isitma')
  banyo_sayisi: number;         // banyo_sayisi int8
  balkon: boolean;             // balkon bool
  asansor: boolean;            // asansor bool
  esyali: boolean;             // esyali bool
  aidat: number;               // aidat int8
  fotolar: string;             // fotolar text
}

function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getListings()
      .then((data) => setListings(data))
      .catch((err) => console.error('İlanlar yüklenirken hata:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
      <div className="d-flex justify-center align-center mb-4">
        <h1 className="text-center mb-4">
          <i className="fas fa-home" style={{ marginRight: 'var(--spacing-sm)', color: 'var(--primary-color)' }}></i>
          Emlak İlanları
        </h1>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span style={{ marginLeft: 'var(--spacing-sm)' }}>İlanlar yükleniyor...</span>
        </div>
      ) : (
        <ListingList listings={listings} />
      )}
    </div>
  );
}

export default ListingsPage;

