import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (adminOnly && !isAdmin) {
        router.replace('/'); // Or a 403 page
      }
    }
  }, [user, isLoading, isAdmin, adminOnly, router]);

  if (isLoading || (!user && !isLoading)) {
    return <div>Loading...</div>;
  }
  if (adminOnly && !isAdmin) {
    return <div>Access denied.</div>;
  }
  return <>{children}</>;
};

export default ProtectedRoute; 