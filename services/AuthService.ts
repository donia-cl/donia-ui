
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

export class AuthService {
  private static instance: AuthService;
  private client: SupabaseClient | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.client) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        let url = '';
        let key = '';

        try {
          // @ts-ignore
          if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL || '';
            // @ts-ignore
            key = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
          }
        } catch (e) { /* ignore */ }

        if (!url || !key) {
          try {
            if (typeof process !== 'undefined' && process.env) {
              url = process.env.REACT_APP_SUPABASE_URL || '';
              key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
            }
          } catch (e) { /* ignore */ }
        }

        if (!url || !key) {
           try {
             const resp = await fetch('/api/config');
             if (resp.ok) {
               const config = await resp.json();
               url = config.supabaseUrl || url;
               key = config.supabaseKey || key;
             }
           } catch (e) {
             console.warn("[AuthService] Runtime config fetch failed.");
           }
        }
          
        if (url && key) {
          this.client = createClient(url, key, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              storageKey: 'donia-auth-token-v1',
              flowType: 'implicit'
            }
          });
        } else {
          console.error("[AuthService] Error Crítico: No se encontraron llaves de Supabase.");
        }
      } catch (e) {
        console.error("[AuthService] Initialization failed:", e);
      }
    })();

    return this.initPromise;
  }

  public getSupabase(): SupabaseClient | null {
    return this.client;
  }

  async signUp(email: string, pass: string, fullName: string) {
    await this.initialize();
    
    if (!this.client) {
        throw new Error("Servicio de autenticación no disponible.");
    }
    
    // 1. Crear usuario en Auth
    const { data, error } = await this.client.auth.signUp({
      email,
      password: pass,
      options: { 
        data: { full_name: fullName }
      }
    });

    if (error) {
        console.error("Supabase SignUp Error:", error);
        throw error;
    }

    // 2. Crear perfil vía API Backend (para saltar RLS policy que da error 403)
    if (data.user) {
      try {
        await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: data.user.id,
                fullName: fullName
            })
        });
      } catch (profileError) {
        console.warn("[AuthService] Error conectando con api/create-profile", profileError);
      }
    }

    return data;
  }

  async signIn(email: string, pass: string) {
    await this.initialize();
    if (!this.client) throw new Error("Servicio de autenticación no disponible.");
    const { data, error } = await this.client.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    await this.initialize();
    if (!this.client) throw new Error("Servicio de autenticación no disponible.");
    
    const redirectTo = window.location.origin;
    
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo,
        skipBrowserRedirect: false
      }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
  }

  async getSession(): Promise<Session | null> {
    await this.initialize();
    if (!this.client) return null;
    try {
      const { data: { session } } = await this.client.auth.getSession();
      return session;
    } catch (e) {
      console.error("Error getting session:", e);
      return null;
    }
  }
}
