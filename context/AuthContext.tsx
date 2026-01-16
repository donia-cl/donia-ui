import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
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
    try {
      let userProfile = await authService.fetchProfile(currentUser.id);
      if (!userProfile && mountedRef.current) {
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
      console.error("[AUTH_ERROR] Error perfil:", err);
      return null;
    }
  };

  const cleanUrlAndRedirect = () => {
     const searchParams = new URLSearchParams(window.location.search);
     const code = searchParams.get('code');
     
     if (code && !codeHandled.current) {
        codeHandled.current = true;
        logStep("Limpiando URL de retorno...");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        const savedRedirect = localStorage.getItem('donia_auth_redirect');
        if (savedRedirect) {
            localStorage.removeItem('donia_auth_redirect');
            window.location.assign(savedRedirect); 
        } else if (window.location.pathname === '/' || window.location.pathname === '/login') {
            window.location.assign('/dashboard');
        }
     }
  };

  useEffect(() => {
    mountedRef.current = true;
    if (initStarted.current) return;
    initStarted.current = true;

    const initApp = async () => {
      logStep("Iniciando flujo resiliente...");
      
      // Failsafe global: Si en 7 segundos seguimos cargando, forzamos entrada como invitado
      const failsafeTimer = setTimeout(() => {
        if (mountedRef.current && loading) {
          logStep("TIMEOUT CRÍTICO: Forzando desactivación de loader.");
          setLoading(false);
          setDebugError("La validación de sesión tardó demasiado. Entrando como invitado.");
        }
      }, 7000);

      try {
        await authService.initialize();
        campaignService.initialize().catch(() => {});
        
        const client = authService.getSupabase();
        if (!client) {
          clearTimeout(failsafeTimer);
          if (mountedRef.current) setLoading(false);
          return;
        }

        // Suscripción temprana
        const { data: { subscription } } = (client.auth as any).onAuthStateChange(async (event: any, session: any) => {
          if (!mountedRef.current) return;
          logStep(`Evento: ${event}`, session?.user?.email);
          
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (currentUser) {
              const p = await loadUserProfile(currentUser);
              if (mountedRef.current) setProfile(p);
              cleanUrlAndRedirect();
            }
            if (mountedRef.current) {
                clearTimeout(failsafeTimer);
                setLoading(false);
            }
          }
          
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            if (mountedRef.current) setLoading(false);
          }
        });

        // REGLA ORO: Delay para evitar colisión de locks de navegador con el proceso interno de Supabase
        await new Promise(r => setTimeout(r, 800));

        logStep("Pidiendo sesión al servidor...");
        const { data: { session }, error: sessionError } = await client.auth.getSession().catch(e => ({ data: { session: null }, error: e }));
        
        if (sessionError) {
            logStep("Error capturado en getSession", sessionError.message);
        }

        if (mountedRef.current) {
          if (session?.user) {
            logStep("Sesión activa encontrada.");
            setUser(session.user);
            const p = await loadUserProfile(session.user);
            if (mountedRef.current) setProfile(p);
            cleanUrlAndRedirect();
            clearTimeout(failsafeTimer);
            setLoading(false);
          } else {
            const hasCode = new URLSearchParams(window.location.search).has('code');
            if (!hasCode) {
                logStep("Sin sesión ni código. Flujo regular.");
                clearTimeout(failsafeTimer);
                setLoading(false);
            } else {
                logStep("Código detectado. Esperando intercambio PKCE...");
                // No quitamos el loading aquí, dejamos que onAuthStateChange SIGNED_IN lo haga
            }
          }
        }

        return () => {
          mountedRef.current = false;
          subscription.unsubscribe();
          clearTimeout(failsafeTimer);
        };
      } catch (error: any) {
        logStep("Error fatal en initApp", error.message);
        clearTimeout(failsafeTimer);
        if (mountedRef.current) setLoading(false);
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
        <div className="text-center px-6">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Seguridad Donia</p>
          <p className="text-slate-900 font-black text-lg">Confirmando tu identidad...</p>
          <p className="mt-4 text-xs text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
            Estamos sincronizando tu sesión con los servidores de seguridad. Esto suele tomar un par de segundos.
          </p>
          {debugError && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-4 py-2 rounded-full flex items-center gap-2">
                    <AlertTriangle size={14} /> {debugError}
                </p>
                <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-violet-600 font-black text-xs uppercase tracking-widest hover:underline">
                    <RefreshCw size={14} /> Reintentar ahora
                </button>
              </div>
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