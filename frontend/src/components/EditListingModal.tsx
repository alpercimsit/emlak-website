import { useState, useEffect } from 'react';
import { Listing } from '../pages/ListingsPage';
import api from '../utils/api';
import PhotoUpload from './PhotoUpload';
import LocationSelector from './LocationSelector';

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
    bulundugu_kat: 0,
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

  // Location data for LocationSelector component
  const [locationData, setLocationData] = useState<{il: string, ilce: string, mahalle: string}>();

  // Form'u mevcut ilan bilgileri ile doldur
  useEffect(() => {
    if (listing && isOpen) {
      const newForm = {
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
        bulundugu_kat: listing.bulundugu_kat || 0,
        kat_sayisi: listing.kat_sayisi || 1,
        isitma: listing.isitma || '',
        banyo_sayisi: listing.banyo_sayisi || 1,
        balkon: listing.balkon || true,
        asansor: listing.asansor || true,
        esyali: listing.esyali || false,
        aidat: listing.aidat || 0,
        fotolar: listing.fotolar || '',
        gizli: listing.gizli || false,
        not: listing.not || ''
      };

      setForm(newForm);

      // Set location data for LocationSelector
      setLocationData({
        il: newForm.il,
        ilce: newForm.ilce,
        mahalle: newForm.mahalle
      });

      // Convert existing photos from URL string to photo objects
      setPhotos(api.urlStringToPhotos(listing.fotolar || ''));

      setFeedback('');
      setFeedbackType('');
    }
  }, [listing, isOpen]);

  // Handle location change from LocationSelector
  const handleLocationChange = (location: {il: string, ilce: string, mahalle: string}) => {
    setLocationData(location);
  };

  // Update form when locationData changes
  useEffect(() => {
    if (locationData) {
      setForm(prev => ({
        ...prev,
        il: locationData.il,
        ilce: locationData.ilce,
        mahalle: locationData.mahalle
      }));
    }
  }, [locationData]);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
            <i className="fas fa-edit" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            İlanı Düzenle
            <small style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--text-muted)', fontWeight: 'normal' }}>
              (İlan #{listing.ilan_no})
            </small>
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
              onLocationChange={handleLocationChange}
              initialLocation={locationData}
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
