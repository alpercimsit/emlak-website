import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ContactPage from './pages/ContactPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('adminToken');
    setIsAdmin(token && token.startsWith('admin-token-') ? true : false);
  }, []);

  const handleNewListing = () => {
    navigate('/admin/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    // Refresh the page to reload listings without admin privileges
    window.location.reload();
  };

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-container">
            <Link to="/" className="navbar-brand">
              <i className="fas fa-home"></i>
              Öz Kafkas Emlak
            </Link>
            <div className="navbar-content">
              {isAdmin && (
                <div className="admin-nav-buttons">
                  <button
                    onClick={handleNewListing}
                    className="btn btn-primary btn-sm"
                  >
                    <i className="fas fa-plus" style={{ marginRight: 'var(--spacing-xs)' }}></i>
                    Yeni İlan Ekle
                  </button>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary btn-sm"
                  >
                    <i className="fas fa-sign-out-alt" style={{ marginRight: 'var(--spacing-xs)' }}></i>
                    Admin Çıkış
                  </button>
                </div>
              )}
              <ul className="navbar-nav">
                <li>
                  <Link to="/" className="nav-link">
                    <i className="fas fa-list"></i>
                    &nbsp;
                    İlanlar
                  </Link>
                </li>
                <li>
                  <Link to="/iletisim" className="nav-link">
                    <i className="fas fa-phone"></i>
                    &nbsp;
                    İletişim
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<ListingsPage />} />
          <Route path="/ilan/:id" element={<ListingDetailPage />} />
          <Route path="/iletisim" element={<ContactPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* Redirect /admin to /admin/login */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

