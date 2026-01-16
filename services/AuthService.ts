
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

  public async initialize(): Promise<void> {
    if (this.client) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        let url = '';
        let key = '';

        // Prioridad 1: Variables de entorno locales
        try {
          // @ts-ignore
          if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL || '';
            // @ts-ignore
            key = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
          }
        } catch (e) { /* ignore */ }

        // Prioridad 2: Fallback a process.env
        if (!url || !key) {
          try {
            if (typeof process !== 'undefined' && process.env) {
              url = process.env.REACT_APP_SUPABASE_URL || '';
              key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
            }
          } catch (e) { /* ignore */ }
        }

        // Prioridad 3: Consultar endpoint (Sin AbortController)
        if (!url || !key) {
           try {
             // Simple fetch, sin signal
             const resp = await fetch('/api/config');
             if (resp.ok) {
               const config = await resp.json();
               url = config.supabaseUrl || url;
               key = config.supabaseKey || key;
             }
           } catch (e: any) {
             console.warn("[AuthService] Config fetch failed (using defaults/env only)");
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
    if (!this.client) throw new Error("Servicio de autenticación no disponible.");
    
    const { data, error } = await (this.client.auth as any).signUp({
      email,
      password: pass,
      options: { data: { full_name: fullName } }
    });

    if (error) throw error;
    if (data.user) {
      try {
        await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.user.id, fullName: fullName })
        });
      } catch (profileError) { /* ignore */ }
    }
    return data;
  }

  async signIn(email: string, pass: string) {
    await this.initialize();
    if (!this.client) throw new Error("Servicio de autenticación no disponible.");
    const { data, error } = await (this.client.auth as any).signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    await this.initialize();
    if (!this.client) throw new Error("Servicio de autenticación no disponible.");
    
    const redirectTo = window.location.origin; 
    
    const { data, error } = await (this.client.auth as any).signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.client) return;
    await (this.client.auth as any).signOut();
  }

  async getSession(): Promise<any> {
    await this.initialize();
    if (!this.client) return null;
    try {
      const { data: { session } } = await (this.client.auth as any).getSession();
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
