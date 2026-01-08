
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
      await Promise.all([
        authService.initialize(),
        campaignService.initialize()
      ]);
      
      const session = await authService.getSession();
      
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }

      const client = authService.getSupabase();
      if (client && mounted) {
        const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            
            // Si el evento es SIGNED_IN y hay tokens en la URL, los limpiamos con cuidado
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
              const hash = window.location.hash;
              if (hash.includes('access_token=')) {
                // Solo eliminamos la parte de los parámetros de Supabase del hash
                // para no romper la ruta de HashRouter (e.g. #/dashboard)
                const cleanHash = hash.split('#')[0] || hash.split('&')[0];
                if (cleanHash !== hash) {
                   window.history.replaceState(null, '', window.location.pathname + window.location.search + cleanHash);
                }
              }
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    initApp();
    return () => { mounted = false; };
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
