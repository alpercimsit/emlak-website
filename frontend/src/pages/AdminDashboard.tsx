import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { Listing } from './ListingsPage';

function AdminDashboard() {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<Listing>>({
    baslik: '',
    detay: '',
    emlakTipi: 'Daire',
    fiyat: 0,
    m2: 0,
    il: '',
    ilce: '',
    mahalle: '',
    sahibiAd: '',
    sahibiTel: '',
    odaSayisi: '2+1',
    binaYasi: '0-5 yıl',
    bulunduguKat: 1,
    katSayisi: 5,
    isitma: 'Kombi',
    banyoSayisi: 1,
    balkon: false,
    asansor: false,
    esyali: false,
    aidat: 0,
    fotolar: ''
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
      await axios.post('/api/listings', form);
      setFeedback('İlan başarıyla eklendi! ✅');
      setFeedbackType('success');
      // Reset form
      setForm({
        baslik: '',
        detay: '',
        emlakTipi: 'Daire',
        fiyat: 0,
        m2: 0,
        il: '',
        ilce: '',
        mahalle: '',
        sahibiAd: '',
        sahibiTel: '',
        odaSayisi: '2+1',
        binaYasi: '0-5 yıl',
        bulunduguKat: 1,
        katSayisi: 5,
        isitma: 'Kombi',
        banyoSayisi: 1,
        balkon: false,
        asansor: false,
        esyali: false,
        aidat: 0,
        fotolar: ''
      });
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      setFeedback('Hata: İlan eklenemedi. ❌');
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
      <div className="d-flex justify-between align-center mb-4">
        <h1 className="text-center mb-4">
          <i className="fas fa-cog" style={{ marginRight: 'var(--spacing-sm)', color: 'var(--primary-color)' }}></i>
          Admin Panel
        </h1>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ marginTop: '0' }}
        >
          <i className="fas fa-sign-out-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
          Çıkış Yap
        </button>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
            <i className="fas fa-plus-circle" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            Yeni İlan Ekle
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={submit}>
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
                required
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
                required
              />
            </div>

            {/* Emlak Tipi ve Fiyat */}
            <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">
                  <i className="fas fa-home" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Emlak Tipi
                </label>
                <select
                  name="emlakTipi"
                  className="form-control"
                  value={form.emlakTipi}
                  onChange={handleChange}
                  required
                >
                  <option value="Daire">Daire</option>
                  <option value="Villa">Villa</option>
                  <option value="Müstakil Ev">Müstakil Ev</option>
                  <option value="Dublex">Dublex</option>
                  <option value="İş Yeri">İş Yeri</option>
                  <option value="Arsa">Arsa</option>
                </select>
              </div>

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
                  required
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
                  required
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
                  required
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
                  required
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
                  name="sahibiAd"
                  className="form-control"
                  placeholder="Ahmet Yılmaz"
                  value={form.sahibiAd}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">
                  <i className="fas fa-phone" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Telefon
                </label>
                <input
                  name="sahibiTel"
                  className="form-control"
                  placeholder="0532 123 45 67"
                  value={form.sahibiTel}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Emlak Özellikleri */}
            <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">
                  <i className="fas fa-bed" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Oda Sayısı
                </label>
                <select
                  name="odaSayisi"
                  className="form-control"
                  value={form.odaSayisi}
                  onChange={handleChange}
                  required
                >
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
                  name="binaYasi"
                  className="form-control"
                  value={form.binaYasi}
                  onChange={handleChange}
                  required
                >
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
                  name="bulunduguKat"
                  className="form-control"
                  placeholder="3"
                  value={form.bulunduguKat}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">
                  <i className="fas fa-building" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Kat Sayısı
                </label>
                <input
                  type="number"
                  name="katSayisi"
                  className="form-control"
                  placeholder="7"
                  value={form.katSayisi}
                  onChange={handleChange}
                  min="1"
                  required
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
                  required
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
                  name="banyoSayisi"
                  className="form-control"
                  placeholder="1"
                  value={form.banyoSayisi}
                  onChange={handleChange}
                  min="1"
                  required
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

            {/* Fotoğraflar */}
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-images" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                Fotoğraf URL'leri (virgülle ayırın)
              </label>
              <input
                name="fotolar"
                className="form-control"
                placeholder="https://example.com/foto1.jpg,https://example.com/foto2.jpg"
                value={form.fotolar}
                onChange={handleChange}
              />
            </div>

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
