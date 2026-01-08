
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
      await authService.initialize();
      await campaignService.initialize();
      
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
            
            // Lógica de redirección y limpieza tras login con Google
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
              const hash = window.location.hash;
              if (hash.includes('access_token=')) {
                // Si estamos en la raíz o login, vamos al dashboard
                if (hash.startsWith('#access_token') || hash === '' || hash === '#/') {
                   window.location.hash = '#/dashboard';
                }
                
                // Limpiamos los parámetros de Supabase de la URL
                const cleanURL = window.location.origin + window.location.pathname + window.location.hash.split('&')[0].split('#')[0];
                // En HashRouter es mejor simplemente navegar al dashboard como hicimos arriba.
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
