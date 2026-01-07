
import { createClient, User, SupabaseClient, Session } from '@supabase/supabase-js';

export class AuthService {
  private static instance: AuthService;
  private client: SupabaseClient | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    if (url && key) {
      this.client = createClient(url, key);
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const resp = await fetch('/api/config');
        if (resp.ok) {
          const config = await resp.json();
          const url = config.supabaseUrl || process.env.REACT_APP_SUPABASE_URL;
          const key = config.supabaseKey || process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
          
          if (url && key && (!this.client || this.client.auth === undefined)) {
            this.client = createClient(url, key);
          }
        }
      } catch (e) {
        console.error("[AuthService] Error cargando config:", e);
      }
    })();

    return this.initPromise;
  }

  public getSupabase(): SupabaseClient | null {
    return this.client;
  }

  async signUp(email: string, pass: string, fullName: string) {
    await this.initialize();
    if (!this.client) throw new Error("Sistema no listo.");
    const { data, error } = await this.client.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, pass: string) {
    await this.initialize();
    if (!this.client) throw new Error("Sistema no listo.");
    const { data, error } = await this.client.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    await this.initialize();
    if (!this.client) throw new Error("Sistema no listo.");
    
    // Forzamos HTTPS en producción para evitar el error de "Insecure redirect" de Google
    let currentOrigin = window.location.origin;
    if (currentOrigin.includes('donia.cl') && !currentOrigin.startsWith('https://')) {
      currentOrigin = currentOrigin.replace('http://', 'https://');
    }

    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: currentOrigin,
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
    await this.client.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    await this.initialize();
    if (!this.client) return null;
    try {
      const { data: { user } } = await this.client.auth.getUser();
      return user;
    } catch {
      return null;
    }
  }

  async getSession(): Promise<Session | null> {
    await this.initialize();
    if (!this.client) return null;
    const { data: { session } } = await this.client.auth.getSession();
    return session;
  }
}

export const getSupabaseClient = () => AuthService.getInstance().getSupabase();
