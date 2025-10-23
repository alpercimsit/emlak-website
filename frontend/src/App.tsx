import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ContactPage from './pages/ContactPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import EditListingModal from './components/EditListingModal';
import { Listing } from './pages/ListingsPage';
import { supabase } from './utils/api';
import logo from './visuals/kafkas_buyuk.png';

// Create context for modal operations
export interface ModalContextType {
  onEditListing?: (listing: Listing) => void;
}

export const ModalContext = createContext<ModalContextType>({});

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is admin using Supabase Auth
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAdminUser = session?.user?.user_metadata?.role === 'admin';
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        const userRole = session.user.user_metadata?.role;
        const adminRole = userRole === 'admin';
        setIsAdmin(adminRole);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Route değişikliklerini dinle ve listings sayfasından çıkıldığında scroll pozisyonunu temizle
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = localStorage.getItem('previousPath');

    // Gidilen yolun bir ilan detayı olup olmadığını kontrol et
    const isNavigatingToListingDetail = currentPath.startsWith('/ilan/');

    // Eğer listings sayfasından (/) başka bir sayfaya geçildiyse 
    // VE bu sayfa bir ilan detayı DEĞİLSE scroll pozisyonunu temizle
    if (previousPath === '/' && currentPath !== '/' && !isNavigatingToListingDetail) {
      localStorage.removeItem('listingsPageScrollPosition');
    }

    // Mevcut path'i kaydet
    localStorage.setItem('previousPath', currentPath);
  }, [location.pathname]);

  const handleNewListing = () => {
    navigate('/admin/dashboard');
  };

  const handleLogout = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Yönetici modundan çıkış yapıyorsun dayı. Tekrar girmek için adres çubuğunun sonuna /admin yaz.');

    if (!confirmed) {
      return;
    }

    try {
      await supabase.auth.signOut();
      setIsAdmin(false);

      // Clear filters from localStorage
      localStorage.removeItem('listingFilters');

      // Navigate to home page after logout and refresh
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: refresh the page
      window.location.reload();
    }
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
              <Link
                to="/"
                className="navbar-brand"
                onClick={(e) => {
                  e.preventDefault();
                  // Filtreleri temizle ve sayfayı yenile
                  localStorage.removeItem('listingFilters');
                  window.location.href = '/';
                }}
              >
                <img
                  src={logo}
                  className="navbar-logo"
                />
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
                    <Link
                      to="/"
                      className="nav-link"
                      onClick={(e) => {
                        e.preventDefault();
                        // Filtreleri temizle ve sayfayı yenile
                        localStorage.removeItem('listingFilters');
                        window.location.href = '/';
                      }}
                    >
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

