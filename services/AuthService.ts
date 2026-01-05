
import { createClient, User, SupabaseClient } from '@supabase/supabase-js';

const getSafeEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
    return '';
  } catch {
    return '';
  }
};

const supabaseUrl = getSafeEnv('REACT_APP_SUPABASE_URL');
const supabaseKey = getSafeEnv('REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY');

// Inicialización segura
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUp(email: string, pass: string, fullName: string) {
    if (!supabase) throw new Error("Configuración de autenticación no encontrada.");
    const { data, error } = await supabase.auth.signUp({
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
    if (!supabase) throw new Error("Configuración de autenticación no encontrada.");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    if (!supabase) throw new Error("Configuración de autenticación no encontrada.");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch {
      return null;
    }
  }
}
