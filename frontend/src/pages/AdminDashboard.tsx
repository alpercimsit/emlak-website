import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Listing } from './ListingsPage';
import PhotoUpload from '../components/PhotoUpload';
import LocationSelector from '../components/LocationSelector';

// Form state tipi - boş string değerleri destekler
interface FormState {
  baslik: string;
  detay: string;
  emlak_tipi: string;
  fiyat: number | '';
  m2: number | '';
  il: string;
  ilce: string;
  mahalle: string;
  sahibi_ad: string;
  sahibi_tel: string;
  ada: number | '';
  parsel: number | '';
  sahibinden_no: number | '';
  sahibinden_tarih: string;
  oda_sayisi: string;
  bina_yasi: string;
  bulundugu_kat: string;
  kat_sayisi: number | '';
  isitma: string;
  banyo_sayisi: number | '';
  balkon: boolean;
  asansor: boolean;
  esyali: boolean;
  aidat: number | '';
  fotolar: string;
  gizli: boolean;
  not: string;
}

// Kat seçenekleri
const katOptions = [
  'Bodrum Kat',
  'Zemin Kat',
  'Giriş Katı',
  'Yüksek Giriş',
  'Bahçe Katı',
  'Çatı Katı',
  'Teras',
  'Müstakil',
  'Villa Tipi',
  'Kot 1',
  'Kot 2',
  'Kot 3',
  'Kot 4',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29',
  '30 ve Üzeri',
];

function AdminDashboard() {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<Array<{id: string, url: string}>>([]);
  const [form, setForm] = useState<FormState>({
    baslik: '',
    detay: '',
    emlak_tipi: 'Arsa',
    fiyat: '',
    m2: '',
    il: '',
    ilce: '',
    mahalle: '',
    sahibi_ad: '',
    sahibi_tel: '',
    ada: '',
    parsel: '',
    sahibinden_no: '',
    sahibinden_tarih: '',
    oda_sayisi: '',
    bina_yasi: '',
    bulundugu_kat: '',
    kat_sayisi: '',
    isitma: 'Kombi', // Will be mapped to 'isitma' in database
    banyo_sayisi: 1,
    balkon: true,
    asansor: true,
    esyali: false,
    aidat: '',
    fotolar: '',
    gizli: false,
    not: ''
  });

  const navigate = useNavigate();

  // Set default location data on component mount
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      il: 'Tekirdağ',
      ilce: 'Saray',
      mahalle: 'Büyükyoncalı Merkez'
    }));
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setForm({ ...form, [name]: target.checked });
    } else if (type === 'number') {
      setForm({ ...form, [name]: Number(value) });
    } else {
      // İlan başlığı için 100 karakter limiti uygula
      if (name === 'baslik' && value.length > 100) {
        return; // Limiti aşan girişi kabul etme
      }
      setForm({ ...form, [name]: value });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setFeedback('');

    try {
      // Convert photos to URL string for database
      const formWithPhotos = {
        ...form,
        fotolar: api.photosToUrlString(photos),
        // Convert empty strings to null for numeric fields
        fiyat: form.fiyat === '' ? null : Number(form.fiyat),
        m2: form.m2 === '' ? null : Number(form.m2),
        ada: form.ada === '' ? null : Number(form.ada),
        parsel: form.parsel === '' ? null : Number(form.parsel),
        sahibinden_no: form.sahibinden_no === '' ? null : Number(form.sahibinden_no),
        kat_sayisi: form.kat_sayisi === '' ? null : Number(form.kat_sayisi),
        banyo_sayisi: form.banyo_sayisi === '' ? null : Number(form.banyo_sayisi),
        aidat: form.aidat === '' ? null : Number(form.aidat)
      };
      
      await api.addListing(formWithPhotos);
      setFeedback('İlan başarıyla eklendi! ✅');
      setFeedbackType('success');
      
      // Reset form and photos
      setPhotos([]);
      setForm({
        baslik: '',
        detay: '',
        emlak_tipi: 'Arsa',
        fiyat: '',
        m2: '',
        il: '',
        ilce: '',
        mahalle: '',
        sahibi_ad: '',
        sahibi_tel: '',
        ada: '',
        parsel: '',
        sahibinden_no: '',
        sahibinden_tarih: '',
        oda_sayisi: '',
        bina_yasi: '',
        bulundugu_kat: '',
        kat_sayisi: '',
        isitma: 'Kombi', // Will be mapped to 'isitma' in database
        banyo_sayisi: 1,
        balkon: true,
        asansor: true,
        esyali: false,
        aidat: '',
        fotolar: '',
        gizli: false,
        not: ''
      });

      // Reset location data to defaults
      setForm(prev => ({
        ...prev,
        il: 'Tekirdağ',
        ilce: 'Saray',
        mahalle: 'Büyükyoncalı Merkez'
      }));
    } catch (err: any) {
      console.error('Error adding listing:', err);
      if (err.message === 'Unauthorized') {
        // Token expired or invalid, redirect to login
        try {
          await api.logout();
        } catch (logoutError) {
          console.error('Logout error:', logoutError);
        }
        navigate('/admin/login');
        return;
      }
      setFeedback(`Hata: İlan eklenemedi. ${err.message || err.details || 'Bilinmeyen hata'} ❌`);
      setFeedbackType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/admin/login');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-body">
          <form onSubmit={submit}>
            {/* Emlak Tipi - En üstte */}
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-home" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                Emlak Tipi
              </label>
              <select
                name="emlak_tipi"
                className="form-control"
                value={form.emlak_tipi}
                onChange={handleChange}
                required
              >
                <option value="Arsa">Arsa</option>
                <option value="Tarla">Tarla</option>
                <option value="bagYeri">Bağ Yeri</option>
                <option value="Hisse">Hisse</option>
                <option value="kiralikDaire">Kiralık Daire</option>
                <option value="satilikDaire">Satılık Daire</option>
              </select>
            </div>

            {/* Temel Bilgiler */}
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-heading" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                İlan Başlığı
              </label>
              <input
                name="baslik"
                className="form-control"
                placeholder="Örn: Merkezi Konumda 2+1 Daire"
                value={form.baslik}
                onChange={handleChange}
                maxLength={100}
              />
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'right',
                marginTop: '4px'
              }}>
                {form.baslik?.length || 0}/100 karakter
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-align-left" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                Açıklama
              </label>
              <textarea
                name="detay"
                className="form-control"
                placeholder="İlan detaylarını yazın..."
                value={form.detay}
                onChange={handleChange}
              />
            </div>

            {/* Fiyat ve Metrekare */}
            <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">
                  <i className="fas fa-lira-sign" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Fiyat (TL)
                </label>
                <input
                  type="number"
                  name="fiyat"
                  className="form-control"
                  value={form.fiyat}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">
                  <i className="fas fa-expand" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Alan (m²)
                </label>
                <input
                  type="number"
                  name="m2"
                  className="form-control"
                  value={form.m2}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Konum Bilgileri */}
            <LocationSelector
              onLocationChange={(location) => {
                setForm(prev => ({
                  ...prev,
                  il: location.il,
                  ilce: location.ilce,
                  mahalle: location.mahalle
                }));
              }}
              initialLocation={{
                il: form.il || '',
                ilce: form.ilce || '',
                mahalle: form.mahalle || ''
              }}
            />


            {/* Arsa Özellikleri - Sadece arsa tiplerinde göster */}
            {(form.emlak_tipi === 'Arsa' || form.emlak_tipi === 'Tarla' ||
             form.emlak_tipi === 'bagYeri' || form.emlak_tipi === 'Hisse') && (
              <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label">
                    <i className="fas fa-map" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                    Ada No
                  </label>
                  <input
                    type="number"
                    name="ada"
                    className="form-control"
                    value={form.ada}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <label className="form-label">
                    <i className="fas fa-map-pin" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                    Parsel No
                  </label>
                  <input
                    type="number"
                    name="parsel"
                    className="form-control"
                    value={form.parsel}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>
            )}

            {/* Emlak Özellikleri - Sadece konut tiplerinde göster */}
            {(form.emlak_tipi === 'kiralikDaire' || form.emlak_tipi === 'satilikDaire') && (
              <>
                <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">
                      <i className="fas fa-bed" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Oda Sayısı
                    </label>
                    <select
                      name="oda_sayisi"
                      className="form-control"
                      value={form.oda_sayisi}
                      onChange={handleChange}
                    >
                      <option value="" selected disabled>Seçiniz</option>
                      <option value="Stüdyo (1+0)">Stüdyo (1+0)</option>
                      <option value="1+1">1+1</option>
                      <option value="2+1">2+1</option>
                      <option value="2+2">2+2</option>
                      <option value="3+1">3+1</option>
                      <option value="3+2">3+2</option>
                      <option value="4+1">4+1</option>
                      <option value="4+2">4+2</option>
                      <option value="4+3">4+3</option>
                      <option value="4+4">4+4</option>
                      <option value="5+1">5+1</option>
                      <option value="5+2">5+2</option>
                      <option value="5+3">5+3</option>
                      <option value="6+1">6+1</option>
                      <option value="6+2">6+2</option>
                      <option value="6+3">6+3</option>
                      <option value="7+1">6+4</option>
                      <option value="7+2">7+2</option>
                      <option value="7+3">7+3</option>
                      <option value="8+1">8+1</option>
                      <option value="8+2">8+2</option>
                      <option value="8+3">8+3</option>
                      <option value="9+1">9+1</option>
                      <option value="9+2">9+2</option>
                      <option value="9+3">9+3</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">
                      <i className="fas fa-calendar" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Bina Yaşı
                    </label>
                    <select
                      name="bina_yasi"
                      className="form-control"
                      value={form.bina_yasi}
                      onChange={handleChange}
                    >
                      <option value="" selected disabled>Seçiniz</option>
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6-10 arası">6-10 arası</option>
                      <option value="11-15 arası">11-15 arası</option>
                      <option value="16-20 arası">16-20 arası</option>
                      <option value="21-25 arası">21-25 arası</option>
                      <option value="26-30 arası">26-30 arası</option>
                      <option value="31 ve üzeri">31 ve üzeri</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">
                      <i className="fas fa-layer-group" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Bulunduğu Kat
                    </label>
                    <select
                      name="bulundugu_kat"
                      className="form-control"
                      value={form.bulundugu_kat}
                      onChange={handleChange}
                    >
                      <option value="" selected disabled>Seçiniz</option>
                      {katOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">
                      <i className="fas fa-building" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Kat Sayısı
                    </label>
                    <input
                      type="number"
                      name="kat_sayisi"
                      className="form-control"
                      value={form.kat_sayisi}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>

                {/* Teknik Özellikler */}
                <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">
                      <i className="fas fa-fire" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Isıtma
                    </label>
                    <select
                      name="isitma"
                      className="form-control"
                      value={form.isitma}
                      onChange={handleChange}
                    >
                      <option value="Kombi">Kombi</option>
                      <option value="Merkezi">Merkezi</option>
                      <option value="Soba">Soba</option>
                      <option value="Klima">Klima</option>
                      <option value="Şömine">Şömine</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">
                      <i className="fas fa-bath" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Banyo Sayısı
                    </label>
                    <input
                      type="number"
                      name="banyo_sayisi"
                      className="form-control"
                      value={form.banyo_sayisi}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">
                      <i className="fas fa-money-bill" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Aidat (TL)
                    </label>
                    <input
                      type="number"
                      name="aidat"
                      className="form-control"
                      value={form.aidat}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>

                {/* Checkbox Özellikler */}
                <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        name="balkon"
                        checked={form.balkon}
                        onChange={handleChange}
                        style={{ marginRight: 'var(--spacing-sm)' }}
                      />
                      <i className="fas fa-sun" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Balkon
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        name="asansor"
                        checked={form.asansor}
                        onChange={handleChange}
                        style={{ marginRight: 'var(--spacing-sm)' }}
                      />
                      <i className="fas fa-arrows-alt-v" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Asansör
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        name="esyali"
                        checked={form.esyali}
                        onChange={handleChange}
                        style={{ marginRight: 'var(--spacing-sm)' }}
                      />
                      <i className="fas fa-couch" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Eşyalı
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Admin Paneli - Sadece adminler için görünür */}
            <div style={{
              border: '2px solid var(--primary-color)',
              borderRadius: '8px',
              padding: 'var(--spacing-lg)',
              marginTop: 'var(--spacing-xl)',
              backgroundColor: 'var(--background-secondary, #f8f9fa)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: 'var(--spacing-md)',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                <i className="fas fa-user-shield" style={{ marginRight: 'var(--spacing-xs)' }}></i>
                Admin Paneli
              </div>

              {/* Sahibi Bilgileri */}
              <div className="d-flex gap-3" style={{ flexWrap: 'wrap', marginBottom: 'var(--spacing-md)' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">
                    <i className="fas fa-user" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                    Sahibi Adı
                  </label>
                  <input
                    name="sahibi_ad"
                    className="form-control"
                    value={form.sahibi_ad}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">
                    <i className="fas fa-phone" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                    Telefon
                  </label>
                  <input
                    name="sahibi_tel"
                    className="form-control"
                    value={form.sahibi_tel}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Sahibinden Bilgileri */}
              <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">
                    <i className="fas fa-hashtag" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                    Sahibinden İlan No
                  </label>
                  <input
                    type="number"
                    name="sahibinden_no"
                    className="form-control"
                    value={form.sahibinden_no}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                  <label className="form-label">
                    <i className="fas fa-calendar" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                    Sahibinden Tarih
                  </label>
                  <input
                    type="date"
                    name="sahibinden_tarih"
                    className="form-control"
                    value={form.sahibinden_tarih}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Admin Not Alanı */}
              <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
                <label className="form-label">
                  <i className="fas fa-sticky-note" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Not
                </label>
                <textarea
                  name="not"
                  className="form-control"
                  placeholder="Admin notları..."
                  value={form.not}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
              {/* İlan Gizleme */}
              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    name="gizli"
                    checked={form.gizli}
                    onChange={handleChange}
                    style={{ marginRight: 'var(--spacing-sm)' }}
                  />
                  <i className="fas fa-eye-slash" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  İlanı Gizle (Sadece admin görebilir)
                </label>
              </div>
            </div>
            <br />

            {/* Fotoğraflar */}
            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={30}
            />

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ width: '100%' }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }}></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  İlanı Kaydet
                </>
              )}
            </button>
          </form>

          {feedback && (
            <div className={`mt-3 ${feedbackType === 'success' ? 'text-success' : 'text-error'}`}>
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
