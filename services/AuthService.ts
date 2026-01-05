
import { createClient, User, SupabaseClient } from '@supabase/supabase-js';

export class AuthService {
  private static instance: AuthService;
  private client: SupabaseClient | null = null;
  private initializing: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Inicializa el cliente de Supabase. 
   * Primero intenta con process.env (por si el bundler las inyectó)
   * Si no, las pide al endpoint /api/config
   */
  public async initialize(): Promise<void> {
    if (this.client) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      try {
        let url = '';
        let key = '';

        // 1. Intentar lectura directa (algunos entornos de dev lo permiten)
        try {
          if (typeof process !== 'undefined' && process.env) {
            url = process.env.REACT_APP_SUPABASE_URL || '';
            key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
          }
        } catch (e) {}

        // 2. Si no están, pedirlas al API del servidor
        if (!url || !key) {
          const res = await fetch('/api/config');
          const config = await res.json();
          url = config.supabaseUrl;
          key = config.supabaseKey;
        }

        if (url && key) {
          this.client = createClient(url, key);
        } else {
          console.error("No se pudieron cargar las credenciales de Supabase.");
        }
      } catch (err) {
        console.error("Error inicializando AuthService:", err);
      }
    })();

    return this.initializing;
  }

  public getSupabase(): SupabaseClient | null {
    return this.client;
  }

  async signUp(email: string, pass: string, fullName: string) {
    await this.initialize();
    if (!this.client) throw new Error("Sistema de autenticación no disponible.");
    
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
    if (!this.client) throw new Error("Sistema de autenticación no disponible.");

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    await this.initialize();
    if (!this.client) throw new Error("Sistema de autenticación no disponible.");

    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
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
}

// Exportamos una instancia de conveniencia para el listener de AuthContext
export const getSupabaseClient = () => AuthService.getInstance().getSupabase();
