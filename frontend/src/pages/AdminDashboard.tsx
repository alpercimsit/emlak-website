import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Listing } from './ListingsPage';
import PhotoUpload from '../components/PhotoUpload';

function AdminDashboard() {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<Array<{id: string, url: string}>>([]);
  const [form, setForm] = useState<Partial<Listing>>({
    baslik: '',
    detay: '',
    emlak_tipi: 'Arsa',
    fiyat: 0,
    m2: 0,
    il: '',
    ilce: '',
    mahalle: '',
    sahibi_ad: '',
    sahibi_tel: '',
    ada: 0,
    parsel: 0,
    sahibinden_no: 0,
    sahibinden_tarih: '',
    oda_sayisi: '',
    bina_yasi: '',
    bulundugu_kat: 0,
    kat_sayisi: 0,
    isitma: '', // Will be mapped to 'isitma' in database
    banyo_sayisi: 1,
      balkon: true,
      asansor: true,
      esyali: false,
      aidat: 0,
      fotolar: '',
      gizli: false,
      not: ''
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setForm({ ...form, [name]: target.checked });
    } else if (type === 'number') {
      setForm({ ...form, [name]: Number(value) });
    } else {
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
        fotolar: api.photosToUrlString(photos)
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
        fiyat: 0,
        m2: 0,
        il: '',
        ilce: '',
        mahalle: '',
        sahibi_ad: '',
        sahibi_tel: '',
        ada: 0,
        parsel: 0,
        sahibinden_no: 0,
        sahibinden_tarih: '',
        oda_sayisi: '',
        bina_yasi: '',
        bulundugu_kat: 0,
        kat_sayisi: 0,
        isitma: '', // Will be mapped to 'isitma' in database
        banyo_sayisi: 1,
        balkon: true,
        asansor: true,
        esyali: false,
        aidat: 0,
        fotolar: '',
        gizli: false,
        not: ''
      });
    } catch (err: any) {
      console.error('Error adding listing:', err);
      if (err.message === 'Unauthorized') {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      setFeedback(`Hata: İlan eklenemedi. ${err.message || err.details || 'Bilinmeyen hata'} ❌`);
      setFeedbackType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
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
              />
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
                  placeholder="1500000"
                  value={form.fiyat}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">
                  <i className="fas fa-expand" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Metrekare
                </label>
                <input
                  type="number"
                  name="m2"
                  className="form-control"
                  placeholder="95"
                  value={form.m2}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>

            {/* Konum Bilgileri */}
            <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">
                  <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  İl
                </label>
                <input
                  name="il"
                  className="form-control"
                  placeholder="İstanbul"
                  value={form.il}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">
                  <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  İlçe
                </label>
                <input
                  name="ilce"
                  className="form-control"
                  placeholder="Kadıköy"
                  value={form.ilce}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">
                  <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Mahalle
                </label>
                <input
                  name="mahalle"
                  className="form-control"
                  placeholder="Moda"
                  value={form.mahalle}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Sahibi Bilgileri */}
            <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">
                  <i className="fas fa-user" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Sahibi Adı
                </label>
                <input
                  name="sahibi_ad"
                  className="form-control"
                  placeholder="Ahmet Yılmaz"
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
                  placeholder="0532 123 45 67"
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
                  placeholder="123456789"
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

            {/* Arsa Özellikleri - Sadece arsa tipinde göster */}
            {form.emlak_tipi === 'Arsa' && (
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
                    placeholder="123"
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
                    placeholder="45"
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
                      <option value="1+0">1+0</option>
                      <option value="1+1">1+1</option>
                      <option value="2+1">2+1</option>
                      <option value="3+1">3+1</option>
                      <option value="4+1">4+1</option>
                      <option value="5+1">5+1</option>
                      <option value="6+1">6+1</option>
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
                      <option value="0-5 yıl">0-5 yıl</option>
                      <option value="6-10 yıl">6-10 yıl</option>
                      <option value="11-15 yıl">11-15 yıl</option>
                      <option value="16-20 yıl">16-20 yıl</option>
                      <option value="21+ yıl">21+ yıl</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                    <label className="form-label">
                      <i className="fas fa-layer-group" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                      Bulunduğu Kat
                    </label>
                    <input
                      type="number"
                      name="bulundugu_kat"
                      className="form-control"
                      placeholder="3"
                      value={form.bulundugu_kat}
                      onChange={handleChange}
                      min="0"
                    />
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
                      placeholder="7"
                      value={form.kat_sayisi}
                      onChange={handleChange}
                      min="1"
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
                      placeholder="1"
                      value={form.banyo_sayisi}
                      onChange={handleChange}
                      min="1"
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
                      placeholder="350"
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

            {/* Admin Seçenekleri */}
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

            {/* Admin Not Alanı */}
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-sticky-note" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                Not (Sadece admin görebilir)
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
