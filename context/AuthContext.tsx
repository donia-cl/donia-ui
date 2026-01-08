
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
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
  const [isInitialized, setIsInitialized] = useState(false);
  
  const authService = AuthService.getInstance();
  const campaignService = CampaignService.getInstance();

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      try {
        // 1. Inicializar servicios (esperar configuración)
        await authService.initialize();
        await campaignService.initialize();
        
        const client = authService.getSupabase();
        
        // 2. Intentar obtener sesión existente
        const session = await authService.getSession();
        
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // 3. Suscribirse a cambios de estado
        if (client) {
          const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
            console.log("[Auth] State Change:", event);
            if (mounted) {
              setUser(session?.user ?? null);
              
              if (event === 'SIGNED_IN') {
                setLoading(false);
                // Si estamos en la raíz con hash de token, redirigir al dashboard
                if (window.location.hash.includes('access_token')) {
                  window.location.hash = '#/dashboard';
                }
              }
              
              if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
                window.location.hash = '#/';
              }
            }
          });
          
          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initApp();
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setLoading(false);
    window.location.hash = '#/';
  };

  // BLOQUEO CRÍTICO: No renderizar el Router (children) hasta que AuthService 
  // haya tenido oportunidad de procesar el hash de la URL.
  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Iniciando Donia...</p>
      </div>
    );
  }

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
