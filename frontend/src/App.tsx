import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ListingsPage from './pages/ListingsPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="container">
          <div className="navbar-container">
            <Link to="/" className="navbar-brand">
              <i className="fas fa-home"></i>
              Emlak Dükkanım
            </Link>
            <ul className="navbar-nav">
              <li>
                <Link to="/" className="nav-link">
                  <i className="fas fa-list"></i>
                  İlanlar
                </Link>
              </li>
              <li>
                <Link to="/iletisim" className="nav-link">
                  <i className="fas fa-phone"></i>
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/admin" className="nav-link">
                  <i className="fas fa-cog"></i>
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<ListingsPage />} />
          <Route path="/iletisim" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

