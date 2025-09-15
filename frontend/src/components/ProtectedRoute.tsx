import { Navigate } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import api from '../utils/api';

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

    // Verify token with our API
    api.verifyToken()
    .then(response => {
      if (response.valid) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    })
    .catch(() => {
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
