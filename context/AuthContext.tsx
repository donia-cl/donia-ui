
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { CampaignService } from '../services/CampaignService';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
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
    const client = authService.getSupabase();
    if (!client) return null;
    
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      return data as Profile;
    } catch (e) {
      return null;
    }
  };

  const ensureProfileExists = async (currentUser: any) => {
    let userProfile = await fetchProfile(currentUser.id);
    
    // Si no existe perfil (común en Google Login por primera vez), lo creamos
    if (!userProfile) {
      console.log("Detectado usuario sin perfil. Intentando crear perfil automáticamente...");
      try {
          const fullName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Usuario';
          await fetch('/api/create-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  id: currentUser.id,
                  fullName: fullName
              })
          });
          // Reintentamos buscar el perfil recién creado
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
      if (userProfile) {
        setProfile(userProfile);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      try {
        await authService.initialize();
        await campaignService.initialize();
        
        const client = authService.getSupabase();
        const session = await authService.getSession();
        
        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            const userProfile = await ensureProfileExists(currentUser);
            setProfile(userProfile);
          }
          
          setLoading(false);
        }

        if (client) {
          const { data: { subscription } } = (client.auth as any).onAuthStateChange(async (event: any, session: any) => {
            if (mounted) {
              const currentUser = session?.user ?? null;
              setUser(currentUser);
              
              if (currentUser) {
                 const userProfile = await ensureProfileExists(currentUser);
                 setProfile(userProfile);
              } else {
                 setProfile(null);
              }

              if (event === 'SIGNED_IN') {
                setLoading(false);
                
                // LÓGICA DE REDIRECCIÓN INTELIGENTE
                const savedRedirect = localStorage.getItem('donia_auth_redirect');
                if (savedRedirect) {
                  localStorage.removeItem('donia_auth_redirect');
                  // Aseguramos formato hash para HashRouter
                  const target = savedRedirect.startsWith('#') ? savedRedirect : `#${savedRedirect}`;
                  window.location.hash = target;
                } else if (window.location.hash.includes('access_token')) {
                  window.location.hash = '#/dashboard';
                }
              }
              
              if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
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
    try {
      await authService.signOut();
    } catch (e) {
      console.error("Error al cerrar sesión (se forzará cierre local):", e);
    } finally {
      // Limpieza forzada del estado local independientemente del resultado del servidor
      setUser(null);
      setProfile(null);
      setLoading(false);
      localStorage.removeItem('donia_auth_redirect'); // Limpiamos cualquier redirección pendiente
      window.location.hash = '#/';
    }
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Iniciando Donia...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
