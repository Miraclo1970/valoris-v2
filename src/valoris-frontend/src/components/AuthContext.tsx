import { createContext, useContext, useState, type ReactNode } from 'react';

export type Rol = 'beheerder' | 'redacteur' | 'lezer';

interface AuthUser {
  id: number;
  naam: string;
  email: string;
  rollen: { domeinId: number; rol: Rol }[];
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  hasRole: (rol: Rol, domeinId?: number) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = sessionStorage.getItem('valoris_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (u: AuthUser) => {
    sessionStorage.setItem('valoris_user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    sessionStorage.removeItem('valoris_user');
    setUser(null);
  };

  // If domeinId is provided, check within that domein; otherwise check globally
  const hasRole = (rol: Rol, domeinId?: number): boolean => {
    if (!user) return false;
    const rolRang: Rol[] = ['lezer', 'redacteur', 'beheerder'];
    const minRang = rolRang.indexOf(rol);
    return user.rollen.some(r =>
      (domeinId === undefined || r.domeinId === domeinId) &&
      rolRang.indexOf(r.rol) >= minRang
    );
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
