import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  
  // Ref para evitar doble ejecución crítica en StrictMode
  const initRef = useRef(false);
  
  const authService = AuthService.getInstance();
  const campaignService = CampaignService.getInstance();

  const loadUserProfile = async (currentUser: any) => {
    if (!currentUser) return null;
    let userProfile = await authService.fetchProfile(currentUser.id);
    
    if (!userProfile) {
      try {
          const fullName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario';
          await fetch('/api/create-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: currentUser.id, fullName: fullName })
          });
          userProfile = await authService.fetchProfile(currentUser.id);
      } catch (err) {
          console.error("Error creating profile:", err);
      }
    }
    return userProfile;
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await authService.fetchProfile(user.id);
      if (userProfile) setProfile(userProfile);
    }
  };

  const cleanUrlAndRedirect = () => {
     // Con BrowserRouter, los parámetros de OAuth están en la URL principal.
     // Esta función limpia esos parámetros y redirige al usuario.
     const currentParams = new URLSearchParams(window.location.search);
     if (currentParams.has('code')) {
        console.log("[AuthContext] Sesión confirmada. Limpiando URL y redirigiendo...");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // Redirección guardada desde el flujo de creación, por ejemplo.
        const savedRedirect = localStorage.getItem('donia_auth_redirect');
        if (savedRedirect) {
            localStorage.removeItem('donia_auth_redirect');
            window.location.assign(savedRedirect); // Navega a la ruta guardada
        } else {
            // Redirección por defecto al panel principal.
            window.location.assign('/dashboard');
        }
     }
  };

  useEffect(() => {
    let mounted = true;
    
    // Evitar doble inicialización en React Strict Mode
    if (initRef.current) return;
    initRef.current = true;

    const initApp = async () => {
      try {
        await authService.initialize();
        campaignService.initialize().catch(() => {});
        const client = authService.getSupabase();
        
        const searchParams = new URLSearchParams(window.location.search);
        const hasCode = searchParams.has('code');

        if (client) {
          // 1. Suscribirse ANTES de getSession para no perder eventos si el intercambio es muy rápido
          const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            
            console.log("[AuthContext] Event:", event);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (currentUser) {
                 const p = await loadUserProfile(currentUser);
                 if (mounted) setProfile(p);
                 // CRÍTICO: Limpiar URL solo cuando confirmamos que estamos logueados
                 cleanUrlAndRedirect(); 
              }
              if (mounted) setLoading(false);
            }
            
            if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              if (mounted) setLoading(false);
            }
          });

          // 2. Obtener sesión actual (puede desencadenar el intercambio de código internamente)
          const { data: { session } } = await client.auth.getSession();
          
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              const p = await loadUserProfile(session.user);
              if (mounted) setProfile(p);
              // Si ya tenemos sesión (ej: recarga de página o intercambio síncrono rápido), limpiamos
              cleanUrlAndRedirect();
            }
          }

          // 3. Manejo del estado de carga para PKCE
          if (hasCode && !session?.user) {
              // Si hay código pero aún no hay sesión, esperamos al evento SIGNED_IN.
              // Pero ponemos un timeout de seguridad por si falla.
              setTimeout(() => {
                  if (mounted && loading) {
                      console.warn("[AuthContext] Timeout esperando intercambio PKCE. Liberando UI.");
                      setLoading(false);
                  }
              }, 4000);
          } else {
              setLoading(false);
          }

          return () => subscription.unsubscribe();
        }
      } catch (error) {
        console.error("[AuthContext] Init error:", error);
        setLoading(false);
      }
    };

    initApp();
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
    window.location.assign('/');
  };

  // Solo mostramos loader de bloqueo si estamos procesando el código
  const isProcessingPKCE = loading && new URLSearchParams(window.location.search).has('code');

  if (isProcessingPKCE) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <div className="text-center">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Donia</p>
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