import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function SellerRoute({ children }: { children: ReactNode }) {
  const role = useAuthStore(state => state.role);

  if (role !== 'seller') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
