import { Navigate } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import axios from '../utils/api';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const token = localStorage.getItem('adminToken');
  
  useEffect(() => {
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Verify token with backend
    axios.post('/api/auth/verify', {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      if (response.data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
      }
    })
    .catch(() => {
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
    });
  }, [token]);

  if (isAuthenticated === null) {
    return <div>Yükleniyor...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}

export default ProtectedRoute;
