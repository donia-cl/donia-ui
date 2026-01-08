
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

        // 3. Limpieza de fragmentos de Supabase (OAuth tokens)
        // Al usar HashRouter, debemos ser cuidadosos: solo limpiamos si el hash NO comienza con #/ (que es una ruta)
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token=') || hash.includes('type=recovery'))) {
          // Si estamos usando HashRouter, el hash podría tener tokens. 
          // Supabase usualmente los pone al principio.
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      // 4. Suscribirse a cambios reales
      const client = authService.getSupabase();
      if (client && mounted) {
        const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            
            // Limpiar hash si hay tokens después del evento de login
            const hash = window.location.hash;
            if (session && (hash.includes('access_token=') || hash.includes('type=recovery'))) {
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
