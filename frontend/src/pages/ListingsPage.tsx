import { useEffect, useState } from 'react';
import api from '../utils/api';
import ListingList from '../components/ListingList';

export interface Listing {
  ilanNo: number;              // ilan_no int8 primary key
  ilanTarihi: string;          // ilan_tarihi timestamp
  baslik: string;              // baslik text
  emlakTipi: string;           // emlak_tipi text
  fiyat: number;               // fiyat int8
  detay: string;               // detay text
  m2: number;                  // m2 int8
  il: string;                  // il text
  ilce: string;                // ilce text
  mahalle: string;             // mahalle text
  sahibindenNo: number;        // sahibinden_no int8
  sahibiAd: string;            // sahibi_ad text
  sahibiTel: string;           // sahibi_tel text
  sahibindenTarih: string;     // sahibinden_tarih date
  ada: number;                 // ada int8
  parsel: number;              // parsel int8
  odaSayisi: string;           // oda_sayisi text
  binaYasi: string;            // bina_yasi text
  bulunduguKat: number;        // bulundugu_kat int8
  katSayisi: number;           // kat_sayisi int8
  isitma: string;              // isitma text
  banyoSayisi: number;         // banyo_sayisi int8
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

