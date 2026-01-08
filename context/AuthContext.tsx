
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
      // Ambos servicios comparten ahora el mismo cliente inicializado
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
            
            // Si hay tokens de Supabase en el hash, los limpiamos sin romper la ruta de React Router
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
              const fullHash = window.location.hash; // Ejemplo: #/dashboard#access_token=...
              if (fullHash.includes('access_token=')) {
                // Dividimos el hash. El primer elemento tras '#' suele ser la ruta (/dashboard)
                const hashParts = fullHash.split('#'); 
                // Reconstruimos el hash manteniendo solo la ruta de la aplicación
                // parts[0] es vacío, parts[1] es la ruta, parts[2] son los tokens
                const cleanRouteHash = hashParts.length >= 2 ? '#' + hashParts[1] : '';
                
                if (cleanRouteHash !== fullHash) {
                   window.history.replaceState(null, '', window.location.pathname + window.location.search + cleanRouteHash);
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
