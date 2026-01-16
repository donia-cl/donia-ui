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
  
  // Ref para evitar que el flujo de inicialización corra dos veces (evita el AbortError de fetch en StrictMode)
  const initStarted = useRef(false);
  
  const authService = AuthService.getInstance();
  const campaignService = CampaignService.getInstance();

  const loadUserProfile = async (currentUser: any) => {
    if (!currentUser) return null;
    try {
      let userProfile = await authService.fetchProfile(currentUser.id);
      if (!userProfile) {
        const fullName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario';
        await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentUser.id, fullName: fullName })
        });
        userProfile = await authService.fetchProfile(currentUser.id);
      }
      return userProfile;
    } catch (err) {
      console.error("Error loading/creating profile:", err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await authService.fetchProfile(user.id);
      if (userProfile) setProfile(userProfile);
    }
  };

  const cleanUrlAndRedirect = () => {
     const searchParams = new URLSearchParams(window.location.search);
     if (searchParams.has('code')) {
        console.log("[AuthContext] Sesión confirmada. Limpiando URL...");
        
        // Limpiamos los parámetros de la URL sin recargar la página para una experiencia fluida
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // Recuperar redirección guardada si existe (ej: desde el wizard de creación)
        const savedRedirect = localStorage.getItem('donia_auth_redirect');
        if (savedRedirect) {
            localStorage.removeItem('donia_auth_redirect');
            window.location.assign(savedRedirect); 
        } else {
            // Si el usuario está en la página de login o raíz, lo llevamos al dashboard
            if (window.location.pathname === '/' || window.location.pathname === '/login') {
                window.location.assign('/dashboard');
            }
        }
     }
  };

  useEffect(() => {
    // Evitar doble ejecución en React 18 Strict Mode que causa el AbortError
    if (initStarted.current) return;
    initStarted.current = true;

    let mounted = true;

    const initApp = async () => {
      try {
        await authService.initialize();
        campaignService.initialize().catch(() => {});
        
        const client = authService.getSupabase();
        if (!client) {
          if (mounted) setLoading(false);
          return;
        }

        // 1. Escuchar cambios de estado de autenticación
        const { data: { subscription } } = (client.auth as any).onAuthStateChange(async (event: any, session: any) => {
          if (!mounted) return;
          
          console.log("[AuthContext] Auth Event:", event);
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (currentUser) {
              const p = await loadUserProfile(currentUser);
              if (mounted) setProfile(p);
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

        // 2. Obtener sesión actual de forma robusta
        const { data: { session } } = await client.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            const p = await loadUserProfile(session.user);
            if (mounted) setProfile(p);
            cleanUrlAndRedirect();
          }
          
          // Desactivar estado de carga si no hay código pendiente de procesar
          const hasCode = new URLSearchParams(window.location.search).has('code');
          if (!session && !hasCode) {
            setLoading(false);
          }
          
          // Timeout de seguridad por si el intercambio de código tarda demasiado
          if (hasCode && !session) {
            setTimeout(() => { if (mounted && loading) setLoading(false); }, 6000);
          }
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("[AuthContext] Init error:", error);
        if (mounted) setLoading(false);
      }
    };

    initApp();
  }, []);

  const signOut = async () => {
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
    window.location.assign('/');
  };

  // Pantalla de carga persistente durante el procesamiento de OAuth/PKCE
  const isProcessingAuth = loading && new URLSearchParams(window.location.search).has('code');

  if (isProcessingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <div className="text-center">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Donia</p>
          <p className="text-slate-900 font-bold text-sm">Validando tu cuenta...</p>
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