import { useState, useEffect } from 'react';
import { Listing } from '../pages/ListingsPage';
import api from '../utils/api';

interface Props {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

function EditListingModal({ listing, isOpen, onClose, onUpdate }: Props) {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<Listing>>({
    baslik: '',
    detay: '',
    emlak_tipi: 'Daire',
    fiyat: 0,
    m2: 0,
    il: '',
    ilce: '',
    mahalle: '',
    sahibi_ad: '',
    sahibi_tel: '',
    oda_sayisi: '2+1',
    bina_yasi: '0-5 yıl',
    bulundugu_kat: 1,
    kat_sayisi: 5,
    isitma: 'Kombi',
    banyo_sayisi: 1,
    balkon: false,
    asansor: false,
    esyali: false,
    aidat: 0,
    fotolar: '',
    gizli: false
  });

  // Form'u mevcut ilan bilgileri ile doldur
  useEffect(() => {
    if (listing && isOpen) {
      setForm({
        baslik: listing.baslik || '',
        detay: listing.detay || '',
        emlak_tipi: listing.emlak_tipi || 'Daire',
        fiyat: listing.fiyat || 0,
        m2: listing.m2 || 0,
        il: listing.il || '',
        ilce: listing.ilce || '',
        mahalle: listing.mahalle || '',
        sahibi_ad: listing.sahibi_ad || '',
        sahibi_tel: listing.sahibi_tel || '',
        oda_sayisi: listing.oda_sayisi || '2+1',
        bina_yasi: listing.bina_yasi || '0-5 yıl',
        bulundugu_kat: listing.bulundugu_kat || 1,
        kat_sayisi: listing.kat_sayisi || 5,
        isitma: listing.isitma || 'Kombi',
        banyo_sayisi: listing.banyo_sayisi || 1,
        balkon: listing.balkon || false,
        asansor: listing.asansor || false,
        esyali: listing.esyali || false,
        aidat: listing.aidat || 0,
        fotolar: listing.fotolar || '',
        gizli: listing.gizli || false
      });
      setFeedback('');
      setFeedbackType('');
    }
  }, [listing, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setFeedback('');

    try {
      await api.updateListing(listing.ilan_no, form);
      setFeedback('İlan başarıyla güncellendi! ✅');
      setFeedbackType('success');
      
      // 1 saniye sonra modal'ı kapat ve sayfayı güncelle
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1000);
      
    } catch (err: any) {
      console.error('Error updating listing:', err);
      if (err.message === 'Unauthorized') {
        setFeedback('Hata: Yetkiniz bulunmuyor ❌');
      } else {
        setFeedback(`Hata: İlan güncellenemedi. ${err.message || err.details || 'Bilinmeyen hata'} ❌`);
      }
      setFeedbackType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
            <i className="fas fa-edit" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            İlanı Düzenle
          </h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
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
                rows={3}
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
                  name="emlak_tipi"
                  className="form-control"
                  value={form.emlak_tipi}
                  onChange={handleChange}
                  required
                >
                  <option value="Arsa">Arsa</option>
                  <option value="Daire">Daire</option>
                  <option value="kiralikDaire">Kiralık Daire</option>
                  <option value="satilikDaire">Satılık Daire</option>
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
                  name="sahibi_ad"
                  className="form-control"
                  placeholder="Ahmet Yılmaz"
                  value={form.sahibi_ad}
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
                  name="sahibi_tel"
                  className="form-control"
                  placeholder="0532 123 45 67"
                  value={form.sahibi_tel}
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
                  name="oda_sayisi"
                  className="form-control"
                  value={form.oda_sayisi}
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
                  name="bina_yasi"
                  className="form-control"
                  value={form.bina_yasi}
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
                  name="bulundugu_kat"
                  className="form-control"
                  placeholder="3"
                  value={form.bulundugu_kat}
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
                  name="kat_sayisi"
                  className="form-control"
                  placeholder="7"
                  value={form.kat_sayisi}
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
                  name="banyo_sayisi"
                  className="form-control"
                  placeholder="1"
                  value={form.banyo_sayisi}
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

            {feedback && (
              <div className={`mb-3 ${feedbackType === 'success' ? 'text-success' : 'text-error'}`}>
                {feedback}
              </div>
            )}

            <div className="d-flex gap-2 justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                <i className="fas fa-times" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                İptal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }}></div>
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                    İlanı Güncelle
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditListingModal;
