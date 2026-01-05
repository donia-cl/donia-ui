
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
   * Inicializa el cliente de Supabase pidiendo las llaves al backend.
   * Esto imita la forma en que el backend maneja las llaves de Gemini.
   */
  public async initialize(): Promise<void> {
    if (this.client) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      try {
        // Pedimos la configuración al servidor (Vercel)
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error("No se pudo obtener la configuración del servidor.");
        
        const config = await res.json();
        const url = config.supabaseUrl;
        const key = config.supabaseKey;

        if (url && key) {
          this.client = createClient(url, key);
          console.log("[AuthService] Supabase configurado con éxito.");
        } else {
          throw new Error("Las llaves de Supabase están vacías en el servidor.");
        }
      } catch (err) {
        console.error("[AuthService] Error crítico de inicialización:", err);
        throw err;
      }
    })();

    return this.initializing;
  }

  public getSupabase(): SupabaseClient | null {
    return this.client;
  }

  async signUp(email: string, pass: string, fullName: string) {
    await this.initialize();
    if (!this.client) throw new Error("Configuración de autenticación no encontrada.");
    
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
    if (!this.client) throw new Error("Configuración de autenticación no encontrada.");

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    await this.initialize();
    if (!this.client) throw new Error("Configuración de autenticación no encontrada.");

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

export const getSupabaseClient = () => AuthService.getInstance().getSupabase();
