
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { CampaignService } from '../services/CampaignService';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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
        .single();
        
      if (error) {
        // No logueamos error ruidoso si es solo que no existe (PGRST116)
        if (error.code !== 'PGRST116') {
           console.error("Error fetching profile:", error);
        }
        return null;
      }
      return data as Profile;
    } catch (e) {
      return null;
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
            const userProfile = await fetchProfile(currentUser.id);
            setProfile(userProfile);
          }
          
          setLoading(false);
        }

        if (client) {
          const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
            console.log("[Auth] State Change:", event);
            if (mounted) {
              const currentUser = session?.user ?? null;
              setUser(currentUser);
              
              if (currentUser) {
                 const userProfile = await fetchProfile(currentUser.id);
                 setProfile(userProfile);
              } else {
                 setProfile(null);
              }

              if (event === 'SIGNED_IN') {
                setLoading(false);
                if (window.location.hash.includes('access_token')) {
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
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
    window.location.hash = '#/';
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
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
