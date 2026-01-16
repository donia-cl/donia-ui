
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { CampaignService } from '../services/CampaignService';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const authService = AuthService.getInstance();
  const campaignService = CampaignService.getInstance();

  const fetchProfile = async (userId: string) => {
    return await authService.fetchProfile(userId);
  };

  const ensureProfileExists = async (currentUser: any) => {
    let userProfile = await fetchProfile(currentUser.id);
    if (!userProfile) {
      try {
          const fullName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario';
          await fetch('/api/create-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: currentUser.id, fullName: fullName })
          });
          userProfile = await fetchProfile(currentUser.id);
      } catch (err) {
          console.error("Error en auto-creación de perfil:", err);
      }
    }
    return userProfile;
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      if (userProfile) setProfile(userProfile);
    }
  };

  useEffect(() => {
    let mounted = true;
    let oauthSafetyTimeout: any;

    const initApp = async () => {
      try {
        await authService.initialize();
        campaignService.initialize().catch(() => {});
        
        const client = authService.getSupabase();
        
        // DETECCIÓN DE OAUTH
        const hash = window.location.hash;
        const hasAccessToken = hash.includes('access_token=');
        
        if (hasAccessToken) {
          console.log("[AuthContext] Detectado callback de OAuth, esperando procesamiento...");
          
          // Timer de seguridad: Si en 8 segundos Supabase no resuelve, forzamos la entrada
          oauthSafetyTimeout = setTimeout(() => {
            if (mounted) {
              console.warn("[AuthContext] OAuth safety timeout. Forcing UI release.");
              setLoading(false);
              // CRÍTICO: Si falló el procesamiento automático, limpiamos el hash manualmente
              // para que el Router no se confunda y muestre la app
              if (window.location.hash.includes('access_token')) {
                 window.location.hash = '#/';
              }
            }
          }, 8000);
        } else {
          // Si NO es OAuth, UI Optimista inmediata
          if (mounted) setLoading(false);
        }

        if (!client) {
          if (mounted) {
             setLoading(false);
             setIsInitialized(true);
          }
          return;
        }

        // Carga de sesión
        const session = await authService.getSession();
        
        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            const p = await ensureProfileExists(currentUser);
            if (mounted) setProfile(p);
          }
        }

        const { data: { subscription } } = (client.auth as any).onAuthStateChange(async (event: any, session: any) => {
          if (!mounted) return;

          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
             const p = await ensureProfileExists(currentUser);
             if (mounted) setProfile(p);
          } else {
             setProfile(null);
          }

          if (event === 'SIGNED_IN') {
            if (oauthSafetyTimeout) clearTimeout(oauthSafetyTimeout);
            setLoading(false);
            
            // Limpieza exitosa del hash
            if (window.location.hash.includes('access_token')) {
              const savedRedirect = localStorage.getItem('donia_auth_redirect');
              if (savedRedirect) {
                localStorage.removeItem('donia_auth_redirect');
                window.location.hash = savedRedirect.startsWith('#') ? savedRedirect : `#${savedRedirect}`;
              } else {
                window.location.hash = '#/dashboard';
              }
            }
          }
          
          if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
             if (!window.location.hash.includes('access_token')) {
               setLoading(false);
             }
          }
        });
        
        return () => { 
          if (oauthSafetyTimeout) clearTimeout(oauthSafetyTimeout);
          subscription.unsubscribe(); 
        };
      } catch (error) {
        console.error("[AuthContext] Fatal init error:", error);
        if (mounted) setLoading(false);
      } finally {
        if (mounted) setIsInitialized(true);
      }
    };

    initApp();
    return () => { 
      mounted = false; 
      if (oauthSafetyTimeout) clearTimeout(oauthSafetyTimeout);
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
      localStorage.removeItem('donia_auth_redirect');
      window.location.hash = '#/';
    }
  };

  // UI DE BLOQUEO: Solo bloqueamos si hay loading Y hay un token en la URL.
  // Si loading es false (por éxito o por timeout), mostramos la app.
  const isBlockedByOAuth = loading && window.location.hash.includes('access_token');

  if (isBlockedByOAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <div className="text-center">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Donia Autenticación</p>
          <p className="text-slate-900 font-bold text-sm">Validando credenciales...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
