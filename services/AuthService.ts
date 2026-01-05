
import { createClient, User, SupabaseClient } from '@supabase/supabase-js';

export class AuthService {
  private static instance: AuthService;
  private client: SupabaseClient | null = null;

  private constructor() {
    // Intentar inicialización inmediata con variables REACT_APP
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
    if (this.client) return;

    try {
      const resp = await fetch('/api/config');
      if (resp.ok) {
        const config = await resp.json();
        if (config.supabaseUrl && config.supabaseKey) {
          this.client = createClient(config.supabaseUrl, config.supabaseKey);
          console.log("[AuthService] Inicializado correctamente.");
        }
      }
    } catch (e) {
      console.error("[AuthService] Error cargando configuración remota:", e);
    }
  }

  public getSupabase(): SupabaseClient | null {
    return this.client;
  }

  async signUp(email: string, pass: string, fullName: string) {
    if (!this.client) throw new Error("Sistema no inicializado.");
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
    if (!this.client) throw new Error("Sistema no inicializado.");
    const { data, error } = await this.client.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    if (!this.client) throw new Error("Sistema no inicializado.");
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
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
