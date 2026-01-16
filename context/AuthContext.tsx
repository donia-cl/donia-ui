import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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
  const [debugError, setDebugError] = useState<string | null>(null);
  
  const initStarted = useRef(false);
  const mountedRef = useRef(true);
  const codeHandled = useRef(false);
  
  const authService = AuthService.getInstance();
  const campaignService = CampaignService.getInstance();

  const logStep = (step: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1];
    console.log(`%c[AUTH_STEP @ ${timestamp}] ${step}`, 'color: #7c3aed; font-weight: bold; background: #f5f3ff; padding: 2px 4px; border-radius: 4px;', data || '');
  };

  const loadUserProfile = async (currentUser: any) => {
    if (!currentUser || !mountedRef.current) return null;
    logStep("Iniciando carga de perfil", currentUser.id);
    try {
      let userProfile = await authService.fetchProfile(currentUser.id);
      if (!userProfile && mountedRef.current) {
        logStep("Perfil inexistente, gatillando auto-creación...");
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
      console.error("[AUTH_ERROR] Fallo carga perfil:", err);
      return null;
    }
  };

  const cleanUrlAndRedirect = () => {
     const searchParams = new URLSearchParams(window.location.search);
     const code = searchParams.get('code');
     
     if (code && !codeHandled.current) {
        codeHandled.current = true;
        logStep("Código PKCE detectado. Limpiando URL para evitar re-procesamiento.");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        const savedRedirect = localStorage.getItem('donia_auth_redirect');
        if (savedRedirect) {
            logStep("Redirigiendo a ruta guardada post-auth:", savedRedirect);
            localStorage.removeItem('donia_auth_redirect');
            window.location.assign(savedRedirect); 
        } else if (window.location.pathname === '/' || window.location.pathname === '/login') {
            logStep("Sin ruta guardada, redirigiendo al dashboard.");
            window.location.assign('/dashboard');
        }
     }
  };

  useEffect(() => {
    mountedRef.current = true;
    if (initStarted.current) {
        logStep("Inicialización ya en curso o completada. Ignorando re-ejecución.");
        return;
    }
    initStarted.current = true;

    const initApp = async () => {
      logStep("Arrancando InitApp principal...");
      try {
        logStep("Paso 1: Inicializando AuthService (Fetch de Config)...");
        await authService.initialize();
        
        logStep("Paso 2: Inicializando CampaignService...");
        campaignService.initialize().catch(e => console.warn("CampaignService init non-critical fail:", e));
        
        const client = authService.getSupabase();
        if (!client) {
          logStep("Error Crítico: Supabase Client no se pudo instanciar.");
          if (mountedRef.current) setLoading(false);
          return;
        }

        // Suscribirse a cambios antes de pedir la sesión para no perder eventos
        logStep("Paso 3: Suscribiendo a onAuthStateChange...");
        const { data: { subscription } } = (client.auth as any).onAuthStateChange(async (event: any, session: any) => {
          if (!mountedRef.current) return;
          
          logStep(`Evento Auth detectado: ${event}`, session?.user?.email);
          const currentUser = session?.user ?? null;
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setUser(currentUser);
            if (currentUser) {
              const p = await loadUserProfile(currentUser);
              if (mountedRef.current) setProfile(p);
              cleanUrlAndRedirect();
            }
            if (mountedRef.current) setLoading(false);
          }
          
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            if (mountedRef.current) setLoading(false);
          }
        });

        logStep("Paso 4: Verificando sesión inicial (getSession)...");
        try {
            const { data: { session }, error: sessionError } = await client.auth.getSession();
            
            if (sessionError) {
                logStep("Error en getSession detectado", sessionError.message);
                if (sessionError.message.includes("Abort")) {
                    setDebugError("Conexión interrumpida por el navegador. Reintentando...");
                }
            }

            if (mountedRef.current) {
              if (session?.user) {
                logStep("Sesión recuperada con éxito para:", session.user.email);
                setUser(session.user);
                const p = await loadUserProfile(session.user);
                if (mountedRef.current) setProfile(p);
                cleanUrlAndRedirect();
              } else {
                const hasCode = new URLSearchParams(window.location.search).has('code');
                if (!hasCode) {
                    logStep("No hay sesión ni código PKCE pendiente. Carga completa.");
                    setLoading(false);
                } else {
                    logStep("Código detectado pero sesión aún no lista. Esperando evento SIGNED_IN...");
                    // Failsafe: si en 10 segs no pasa nada, quitamos el loader
                    setTimeout(() => { if (mountedRef.current && loading) setLoading(false); }, 10000);
                }
              }
            }
        } catch (innerError: any) {
            if (innerError.name === 'AbortError') {
                logStep("AbortError capturado en getSession (Esperado en re-render). Ignorando.");
            } else {
                throw innerError;
            }
        }

        return () => {
          mountedRef.current = false;
          subscription.unsubscribe();
        };
      } catch (error: any) {
        logStep("FALLO CRÍTICO EN FLUJO INIT", error.message);
        if (mountedRef.current) setLoading(false);
      }
    };

    initApp();
  }, []);

  const signOut = async () => {
    logStep("Iniciando cierre de sesión manual...");
    setLoading(true);
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
    window.location.assign('/');
  };

  const refreshProfile = async () => {
    if (user && mountedRef.current) {
      const p = await loadUserProfile(user);
      setProfile(p);
    }
  };

  const isProcessingAuth = loading && new URLSearchParams(window.location.search).has('code');

  if (isProcessingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white gap-6">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-violet-600 rounded-full animate-ping"></div>
            </div>
        </div>
        <div className="text-center">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Seguridad Donia</p>
          <p className="text-slate-900 font-black text-lg">Verificando tu sesión...</p>
          {debugError && (
              <p className="mt-4 text-[10px] text-rose-500 font-bold bg-rose-50 px-4 py-2 rounded-full flex items-center gap-2">
                  <AlertTriangle size={14} /> {debugError}
              </p>
          )}
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