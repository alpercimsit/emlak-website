import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/api';
import { Listing } from './ListingsPage';

function AdminDashboard() {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<Partial<Listing>>({
    title: '',
    description: '',
    price: 0,
    rooms: 0,
    latitude: 0,
    longitude: 0,
    imageUrl: ''
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
        title: '',
        description: '',
        price: 0,
        rooms: 0,
        latitude: 0,
        longitude: 0,
        imageUrl: ''
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
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-heading" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                İlan Başlığı
              </label>
              <input
                name="title"
                className="form-control"
                placeholder="Örn: 3+1 Daire Kadıköy'de"
                value={form.title}
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
                name="description"
                className="form-control"
                placeholder="İlan detaylarını yazın..."
                value={form.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">
                  <i className="fas fa-lira-sign" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Fiyat (TL)
                </label>
                <input
                  type="number"
                  name="price"
                  className="form-control"
                  placeholder="150000"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">
                  <i className="fas fa-bed" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Oda Sayısı
                </label>
                <input
                  type="number"
                  name="rooms"
                  className="form-control"
                  placeholder="3"
                  value={form.rooms}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">
                  <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Enlem (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  className="form-control"
                  placeholder="41.0082"
                  value={form.latitude}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">
                  <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Boylam (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  className="form-control"
                  placeholder="28.9784"
                  value={form.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-image" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                Resim URL (İsteğe bağlı)
              </label>
              <input
                name="imageUrl"
                className="form-control"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
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
