import { Navigate, useParams } from 'react-router-dom';
import { useAuth, type Rol } from './AuthContext';
import type { ReactNode } from 'react';

interface Props {
  rol: Rol;
  children: ReactNode;
}

export function RequireAuth({ rol, children }: Props) {
  const { user, hasRole } = useAuth();
  const { domeinId } = useParams();
  const id = domeinId ? parseInt(domeinId) : undefined;

  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(rol, id)) return <Navigate to="/geen-toegang" replace />;

  return <>{children}</>;
}
