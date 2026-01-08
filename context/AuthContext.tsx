
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
      // 1. Inicializar servicios
      await authService.initialize();
      await campaignService.initialize();
      
      const client = authService.getSupabase();
      
      // 2. Si detectamos tokens de Supabase en la URL, esperamos a que el listener actúe
      const hasAuthToken = window.location.hash.includes('access_token=');
      
      const session = await authService.getSession();
      
      if (mounted) {
        setUser(session?.user ?? null);
        // Solo quitamos el loading si no estamos en medio de un proceso de OAuth
        if (!hasAuthToken) {
          setLoading(false);
        }
      }

      if (client && mounted) {
        const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            
            // Si el login fue exitoso (especialmente vía Google/OAuth)
            if (event === 'SIGNED_IN' && session) {
              setLoading(false);
              // Si el hash actual es basura de Supabase, limpiamos y vamos al dashboard
              if (window.location.hash.includes('access_token=')) {
                window.location.hash = '#/dashboard';
              }
            }
            
            if (event === 'SIGNED_OUT') {
              setUser(null);
              setLoading(false);
            }
          }
        });

        // Timeout de seguridad: Si después de 5 segundos de ver un token no hemos logueado, liberamos el loading
        if (hasAuthToken) {
          setTimeout(() => {
            if (mounted) setLoading(false);
          }, 5000);
        }

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
    window.location.hash = '#/';
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
