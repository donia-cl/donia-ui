import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthService } from '../services/AuthService';
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
  const mountedRef = useRef(true);

  // Carga el perfil con lógica de reintento para evitar race conditions
  const loadUserProfile = async (currentUser: any, retryCount = 0): Promise<Profile | null> => {
    if (!currentUser || !mountedRef.current) return null;
    
    try {
      let userProfile = await authService.fetchProfile(currentUser.id);
      
      // Si no existe, esperamos un momento (el trigger de DB podría estar trabajando)
      if (!userProfile && retryCount < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadUserProfile(currentUser, retryCount + 1);
      }

      // Si después de los reintentos sigue sin existir, intentamos creación manual (fallback)
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
      return null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    let subscription: any = null;
    
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        const client = authService.getSupabase();
        
        if (!client) {
          if (mountedRef.current) setLoading(false);
          return;
        }

        const { data } = client.auth.onAuthStateChange(async (event, session) => {
          if (!mountedRef.current) return;
          
          const currentUser = session?.user ?? null;
          
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            setUser(currentUser);
            
            if (currentUser) {
              const p = await loadUserProfile(currentUser);
              if (mountedRef.current) setProfile(p);
              
              if (window.location.search.includes('code=')) {
                const url = new URL(window.location.href);
                url.searchParams.delete('code');
                url.searchParams.delete('state');
                window.history.replaceState({}, document.title, url.pathname);
              }
            }
            
            if (mountedRef.current) setLoading(false);
          }
          
          if (event === 'TOKEN_REFRESHED') {
            setUser(currentUser);
          }
          
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            if (mountedRef.current) setLoading(false);
          }
        });

        subscription = data.subscription;

      } catch (error) {
        console.error("[AUTH] Error crítico inicialización:", error);
        if (mountedRef.current) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mountedRef.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current && loading) {
        authService.signOut().finally(() => {
          if (mountedRef.current) setLoading(false);
        });
      }
    }, 10000);
    return () => clearTimeout(safetyTimeout);
  }, [loading]);

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

  if (loading) {
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
          <p className="text-slate-900 font-black text-lg">Validando acceso...</p>
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