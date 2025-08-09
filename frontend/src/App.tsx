import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ListingsPage from './pages/ListingsPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <div>
      <nav style={{ padding: '1rem', background: '#f5f5f5' }}>
        <Link to="/">İlanlar</Link> |{' '}
        <Link to="/iletisim">İletişim</Link> |{' '}
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/iletisim" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;

