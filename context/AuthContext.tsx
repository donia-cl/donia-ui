
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
        const hasAccessToken = window.location.hash.includes('access_token=');
        if (hasAccessToken) {
          console.log("[AuthContext] Detectado callback de OAuth, esperando procesamiento...");
          // Timer de seguridad: Si en 8 segundos no ha logueado, liberamos la pantalla
          oauthSafetyTimeout = setTimeout(() => {
            if (mounted && loading) {
              console.warn("[AuthContext] OAuth safety timeout triggered. Releasing UI.");
              setLoading(false);
            }
          }, 8000);
        }

        const session = await authService.getSession();
        
        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            const p = await ensureProfileExists(currentUser);
            if (mounted) setProfile(p);
          }

          if (!hasAccessToken) {
            setLoading(false);
          }
        }

        if (client) {
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
              
              const savedRedirect = localStorage.getItem('donia_auth_redirect');
              if (savedRedirect) {
                localStorage.removeItem('donia_auth_redirect');
                window.location.hash = savedRedirect.startsWith('#') ? savedRedirect : `#${savedRedirect}`;
              } else {
                if (window.location.hash.includes('access_token')) {
                  window.location.hash = '#/dashboard';
                }
              }
            }
            
            if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
               // En INITIAL_SESSION si no hay token de acceso, ya podemos mostrar la app
               if (!window.location.hash.includes('access_token')) {
                 setLoading(false);
               }
            }
          });
          
          return () => { 
            if (oauthSafetyTimeout) clearTimeout(oauthSafetyTimeout);
            subscription.unsubscribe(); 
          };
        }
      } catch (error) {
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

  // Solo bloqueamos con el loader si estamos inicializando O si estamos procesando un token de OAuth activamente
  const isBlockedByOAuth = loading && window.location.hash.includes('access_token');

  if (!isInitialized || isBlockedByOAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Iniciando sesión segura...</p>
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
