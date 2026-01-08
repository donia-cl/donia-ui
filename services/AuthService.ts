
import { createClient, User, SupabaseClient, Session } from '@supabase/supabase-js';

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
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const resp = await fetch('/api/config');
        if (resp.ok) {
          const config = await resp.json();
          const url = config.supabaseUrl || process.env.REACT_APP_SUPABASE_URL;
          const key = config.supabaseKey || process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
          
          if (url && key && !this.client) {
            this.client = createClient(url, key, {
              auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: 'sb-mkdqpkrtegkhzakopnov-auth-token',
                flowType: 'implicit' // Forzamos implicit para mejor compatibilidad con HashRouter
              }
            });
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
    
    // Redirigimos a la base. Supabase inyectará el token en el fragmento #
    const redirectTo = window.location.origin + window.location.pathname;
    
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' }
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
    const { data: { session } } = await this.client.auth.getSession();
    return session;
  }
}
