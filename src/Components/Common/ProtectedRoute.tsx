import { Navigate, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import Spinner from './Loading/Spinner';
import { useAuth } from '../../Utlilities/auth/AuthContext';

/**
 * Props for ProtectedRoute.
 */
type ProtectedRouteProps = {
  children: ReactElement;
};

/**
 * Guards routes based on auth state.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <Spinner />;
  }

  if (status === 'signed_out') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
