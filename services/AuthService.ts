import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '../types';

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

  /**
   * Inicializa el cliente una sola vez.
   * Si las credenciales no están en el entorno, las busca en el endpoint de config.
   */
  public async initialize(): Promise<void> {
    if (this.client) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        let url = '';
        let key = '';

        // 1. Intentar variables de entorno (Vite/CRA)
        try {
          // @ts-ignore
          const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : process.env;
          url = env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL || '';
          key = env.VITE_SUPABASE_KEY || env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
        } catch (e) { /* ignore */ }

        // 2. Fallback a configuración de servidor
        if (!url || !key) {
           try {
             const resp = await fetch('/api/config');
             if (resp.ok) {
               const config = await resp.json();
               url = config.supabaseUrl || url;
               key = config.supabaseKey || key;
             }
           } catch (e: any) {
             console.error("[AuthService] Error crítico cargando config de servidor");
           }
        }
          
        if (url && key && !this.client) {
          this.client = createClient(url, key, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true, // Crucial para PKCE automático
              flowType: 'pkce',
              storageKey: 'donia-auth-token-v1'
            }
          });
          console.log("[AuthService] Supabase Client Initialized (Singleton)");
        }
      } catch (e) {
        console.error("[AuthService] Fallo fatal en inicialización:", e);
      }
    })();

    return this.initPromise;
  }

  public getSupabase(): SupabaseClient | null {
    return this.client;
  }

  async fetchProfile(userId: string): Promise<Profile | null> {
    try {
      const response = await fetch(`/api/get-profile?userId=${userId}`);
      if (!response.ok) return null;
      const json = await response.json();
      return json.success ? json.data : null;
    } catch (e) {
      return null;
    }
  }

  async signUp(email: string, pass: string, fullName: string) {
    await this.initialize();
    if (!this.client) throw new Error("Servicio no disponible");
    
    const { data, error } = await this.client.auth.signUp({
      email,
      password: pass,
      options: { 
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, pass: string) {
    await this.initialize();
    if (!this.client) throw new Error("Servicio no disponible");
    const { data, error } = await this.client.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    await this.initialize();
    if (!this.client) throw new Error("Servicio no disponible");
    
    const redirectTo = window.location.origin; 
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
  }

  async getSession(): Promise<any> {
    await this.initialize();
    if (!this.client) return null;
    try {
      const { data: { session } } = await this.client.auth.getSession();
      return session;
    } catch (e: any) {
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const response = await fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, updates })
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error || "Error updating profile");
    return json.data;
  }
}