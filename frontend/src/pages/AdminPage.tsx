import { useState } from 'react';
import axios from 'axios';
import { Listing } from './ListingsPage';

function AdminPage() {
  const [token, setToken] = useState('');
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState<Partial<Listing>>({
    title: '',
    description: '',
    price: 0,
    rooms: 0,
    latitude: 0,
    longitude: 0,
    imageUrl: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/listings', form, { headers: { 'X-ADMIN-TOKEN': token } });
      setFeedback('İlan başarıyla eklendi');
    } catch (err) {
      setFeedback('Hata: İlan eklenemedi (token?)');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Admin - Yeni İlan Ekle</h2>
      <form onSubmit={submit} style={{ maxWidth: 400 }}>
        <div>
          <label>Admin Token</label>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div>
          <label>Başlık</label>
          <input name="title" value={form.title} onChange={handleChange} />
        </div>
        <div>
          <label>Açıklama</label>
          <textarea name="description" value={form.description} onChange={handleChange} />
        </div>
        <div>
          <label>Fiyat</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} />
        </div>
        <div>
          <label>Oda Sayısı</label>
          <input type="number" name="rooms" value={form.rooms} onChange={handleChange} />
        </div>
        <div>
          <label>Enlem (lat)</label>
          <input type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} />
        </div>
        <div>
          <label>Boylam (lon)</label>
          <input type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} />
        </div>
        <div>
          <label>Resim URL</label>
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} />
        </div>
        <button type="submit">Kaydet</button>
      </form>
      {feedback && <p>{feedback}</p>}
    </div>
  );
}

export default AdminPage;

