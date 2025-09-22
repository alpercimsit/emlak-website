import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ContactPage from './pages/ContactPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import EditListingModal from './components/EditListingModal';
import { Listing } from './pages/ListingsPage';

// Create context for modal operations
export interface ModalContextType {
  onEditListing?: (listing: Listing) => void;
}

export const ModalContext = createContext<ModalContextType>({});

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
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

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
  };

  const handleCloseEdit = () => {
    setEditingListing(null);
  };

  const handleUpdateSuccess = () => {
    // Refresh the page to reload listings
    window.location.reload();
  };

  return (
    <ModalContext.Provider value={{ onEditListing: handleEditListing }}>
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
                    <span style={{ fontSize: '0.9em', color: 'black', marginRight: 'var(--spacing-sm)' }}>
                      Admin Modu
                    </span>
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

        {/* Edit Listing Modal - rendered at document level */}
        {editingListing && (
          <EditListingModal
            listing={editingListing}
            isOpen={true}
            onClose={handleCloseEdit}
            onUpdate={handleUpdateSuccess}
          />
        )}
      </div>
    </ModalContext.Provider>
  );
}

export default App;

