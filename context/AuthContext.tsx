
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService, supabase } from '../services/AuthService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = AuthService.getInstance();

  useEffect(() => {
    let mounted = true;

    // Verificar sesión inicial
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      if (mounted) {
        setUser(currentUser);
        setLoading(false);
      }
    };

    checkUser();

    // Listener de cambios de auth
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
      return () => { mounted = false; };
    }
  }, []);

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
