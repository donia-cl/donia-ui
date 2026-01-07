
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
      // 1. Inicializamos servicios
      await Promise.all([
        authService.initialize(),
        campaignService.initialize()
      ]);
      
      // 2. Recuperar sesión actual
      const session = await authService.getSession();
      
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);

        // 3. Limpieza de URL (Elimina el #access_token de la barra de direcciones)
        if (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('type=recovery'))) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      // 4. Suscribirse a cambios reales (Login, Logout, Token Refreshed)
      const client = authService.getSupabase();
      if (client && mounted) {
        const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
          if (mounted) {
            console.log("[AuthContext] Auth Event:", event);
            setUser(session?.user ?? null);
            
            // Limpiar hash en cualquier evento exitoso si persiste
            if (session && window.location.hash.includes('access_token=')) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
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
