
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../services/AuthService';
import { CampaignService } from '../services/CampaignService';

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
  const campaignService = CampaignService.getInstance();

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      // 1. Inicializamos ambos servicios (buscan llaves en env o API)
      await Promise.all([
        authService.initialize(),
        campaignService.initialize()
      ]);
      
      // 2. Verificamos si hay un usuario logueado
      const currentUser = await authService.getCurrentUser();
      
      if (mounted) {
        setUser(currentUser);
        setLoading(false);
      }

      // 3. Suscribirse a cambios de estado de Supabase
      const client = authService.getSupabase();
      if (client && mounted) {
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    initApp();

    return () => {
      mounted = false;
    };
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
