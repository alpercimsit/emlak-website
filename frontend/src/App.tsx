import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ContactPage from './pages/ContactPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-container">
            <Link to="/" className="navbar-brand">
              <i className="fas fa-home"></i>
              Öz Kafkas Emlak
            </Link>
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

