import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setFeedback('Kullanıcı adı ve şifre gerekli');
      setFeedbackType('error');
      return;
    }

    setIsSubmitting(true);
    setFeedback('');

    try {
      const result = await api.login(credentials.username, credentials.password);

      setFeedback('Giriş başarılı! Yönlendiriliyorsunuz...');
      setFeedbackType('success');

      // Redirect to main page (listings) in admin mode after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);

    } catch (err) {
      setFeedback('Hata: Kullanıcı adı veya şifre yanlış ❌');
      setFeedbackType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
      <div className="d-flex justify-center align-center" style={{ minHeight: '60vh' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="card-header">
            <h2 style={{ margin: 0, textAlign: 'center', color: 'var(--text-primary)' }}>
              <i className="fas fa-shield-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
              Admin Giriş
            </h2>
          </div>
          <div className="card-body">
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-user" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  placeholder="Kullanıcı adınızı girin..."
                  value={credentials.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-lock" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                  Şifre
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Şifrenizi girin..."
                  value={credentials.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', marginRight: 'var(--spacing-sm)' }}></div>
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
                    Giriş Yap
                  </>
                )}
              </button>
            </form>

            {feedback && (
              <div className={`mt-3 ${feedbackType === 'success' ? 'text-success' : 'text-error'}`} style={{ textAlign: 'center' }}>
                {feedback}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
