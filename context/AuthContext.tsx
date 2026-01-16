
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

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      try {
        await authService.initialize();
        campaignService.initialize().catch(() => {});
        const client = authService.getSupabase();
        
        // PKCE LOGIC: El código viene en 'search' (?code=...), NO en 'hash' (#)
        // Esto evita conflicto con HashRouter
        const searchParams = new URLSearchParams(window.location.search);
        const hasCode = searchParams.has('code');

        if (client) {
          // getSession maneja el intercambio de código PKCE internamente
          const { data: { session } } = await client.auth.getSession();
          
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              const p = await loadUserProfile(session.user);
              if (mounted) setProfile(p);
            }

            // LIMPIEZA DE URL (PKCE)
            // Si la URL tiene ?code=, significa que acabamos de volver de Google/Supabase.
            // Limpiamos el query string para que se vea bien y evitamos bucles.
            if (hasCode) {
               console.log("[AuthContext] PKCE Flow detectado. Limpiando URL...");
               
               // Limpiamos la query (?code=...) pero mantenemos el hash (#/ruta)
               const newUrl = window.location.pathname + window.location.hash;
               window.history.replaceState({}, document.title, newUrl);

               // Manejo de redirección post-login
               const savedRedirect = localStorage.getItem('donia_auth_redirect');
               if (savedRedirect) {
                 localStorage.removeItem('donia_auth_redirect');
                 // Navegamos al hash guardado si es diferente al actual
                 if (window.location.hash !== savedRedirect && window.location.hash !== `#${savedRedirect}`) {
                    window.location.hash = savedRedirect.startsWith('#') ? savedRedirect : `#${savedRedirect}`;
                 }
               } else {
                 // Si no hay redirección específica y estamos en root o login, ir al dashboard
                 if (window.location.hash === '#/' || window.location.hash === '#/login' || window.location.hash === '') {
                    window.location.hash = '#/dashboard';
                 }
               }
            }
          }

          // Listener para cambios de sesión en tiempo real
          const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (currentUser) {
                 const p = await loadUserProfile(currentUser);
                 if (mounted) setProfile(p);
              }
            }
            
            if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              window.location.hash = '#/';
            }
          });

          return () => subscription.unsubscribe();
        }
      } catch (error) {
        console.error("[AuthContext] Init error:", error);
      } finally {
        if (mounted) setLoading(false);
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
    window.location.hash = '#/';
  };

  // UI DE BLOQUEO (SOLO PARA PKCE)
  // Solo bloqueamos la pantalla si estamos en medio del intercambio de código (?code=...)
  // Esto evita que se cuelgue si algo falla, ya que si no hay 'code', entra normal.
  const isProcessingPKCE = loading && new URLSearchParams(window.location.search).has('code');

  if (isProcessingPKCE) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <div className="text-center">
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Donia</p>
          <p className="text-slate-900 font-bold text-sm">Validando sesión segura...</p>
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
