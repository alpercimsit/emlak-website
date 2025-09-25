import { useState, useEffect, useRef } from 'react';
import { Listing } from '../pages/ListingsPage';
import api from '../utils/api';
import PhotoUpload from './PhotoUpload';
import LocationSelector from './LocationSelector';

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
  const [photos, setPhotos] = useState<Array<{id: string, url: string}>>([]);
  const modalContentRef = useRef<HTMLDivElement>(null);
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
    ada: 0,
    parsel: 0,
    sahibinden_no: 0,
    sahibinden_tarih: '',
    oda_sayisi: '',
    bina_yasi: '',
    bulundugu_kat: '',
    kat_sayisi: 1,
    isitma: '',
    banyo_sayisi: 1,
    balkon: true,
    asansor: true,
    esyali: false,
    aidat: 0,
    fotolar: '',
    gizli: false,
    not: ''
  });

  // Track if mouse was pressed inside modal
  const [mouseDownInside, setMouseDownInside] = useState(false);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if mouse was not pressed inside modal
    if (!mouseDownInside) {
      onClose();
    }
    setMouseDownInside(false);
  };

  // Handle mouse down to track where the click started
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    setMouseDownInside(modalContentRef.current?.contains(e.target as Node) || false);
  };

  // Form'u mevcut ilan bilgileri ile doldur
  useEffect(() => {
    if (listing && isOpen) {
      setMouseDownInside(false); // Reset click tracking when modal opens
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
        ada: listing.ada || 0,
        parsel: listing.parsel || 0,
        sahibinden_no: listing.sahibinden_no || 0,
        sahibinden_tarih: listing.sahibinden_tarih || '',
        oda_sayisi: listing.oda_sayisi || '',
        bina_yasi: listing.bina_yasi || '',
        bulundugu_kat: listing.bulundugu_kat || '',
        kat_sayisi: listing.kat_sayisi || 1,
        isitma: listing.isitma || '',
        banyo_sayisi: listing.banyo_sayisi || 1,
        balkon: listing.balkon,
        asansor: listing.asansor,
        esyali: listing.esyali,
        aidat: listing.aidat || 0,
        fotolar: listing.fotolar || '',
        gizli: listing.gizli || false,
        not: listing.not || ''
      });

      // Convert existing photos from URL string to photo objects
      setPhotos(api.urlStringToPhotos(listing.fotolar || ''));

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
      // İlan başlığı için 100 karakter limiti uygula
      if (name === 'baslik') {
        const currentTitle = form.baslik || '';
        const currentLength = currentTitle.length;

        // Eğer mevcut başlık 100 karakterden uzunsa, kullanıcı başlığı düzenleyebilsin
        // Ama mevcut başlıktan daha uzun olamasın
        if (currentLength > 100 && value.length > currentLength) {
          return; // Mevcut başlıktan daha uzun girişi kabul etme
        }

        // Eğer mevcut başlık 100 karakter veya daha kısaysa, normal limit uygula
        if (currentLength <= 100 && value.length > 100) {
          return; // 100 karakter limitini aşan girişi kabul etme
        }
      }
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setFeedback('');

    try {
      // Delete old photos that are no longer in the current photos array
      const oldPhotos = api.urlStringToPhotos(listing.fotolar || '');
      const currentPhotoUrls = photos.map(p => p.url);
      const photosToDelete = oldPhotos.filter(oldPhoto => 
        !currentPhotoUrls.includes(oldPhoto.url)
      );
      
      // Delete removed photos from storage
      for (const photoToDelete of photosToDelete) {
        try {
          await api.deletePhoto(photoToDelete.url);
        } catch (error) {
          console.error('Failed to delete old photo:', error);
        }
      }

      // Convert photos to URL string for database
      const formWithPhotos = {
        ...form,
        fotolar: api.photosToUrlString(photos)
      };
      
      await api.updateListing(listing.ilan_no, formWithPhotos);
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
    <div className="modal-overlay" onClick={handleOverlayClick} onMouseDown={handleOverlayMouseDown}>
      <div ref={modalContentRef} className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '28px' }}>
            <i className="fas fa-edit" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            İlanı Düzenle
            <small style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '20px' }}>
              (İlan #{listing.ilan_no})
            </small>
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
              }}
              style={{ fontSize: '0.9rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px', marginRight: 'var(--spacing-xs)' }}></div>
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{ marginRight: 'var(--spacing-xs)' }}></i>
                  Güncelle
                </>
              )}
            </button>
            <button
              className="modal-close"
              onClick={onClose}
              type="button"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
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
                maxLength={(form.baslik && form.baslik.length > 100) ? form.baslik.length : 100}
              />
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'right',
                marginTop: '4px'
              }}>
                {form.baslik?.length || 0}/{(form.baslik && form.baslik.length > 100) ? form.baslik.length : 100} karakter
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
                rows={3}
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
            {form.emlak_tipi !== 'Arsa' && (
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
              listingId={listing.ilan_no}
            />

            {feedback && (
              <div className={`mb-3 ${feedbackType === 'success' ? 'text-success' : 'text-error'}`}>
                {feedback}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditListingModal;
