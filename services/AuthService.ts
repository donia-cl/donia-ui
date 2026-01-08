
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
    if (this.client) return; // Si ya existe cliente, no hacer nada
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        let url = '';
        let key = '';

        // 1. Intentar cargar variables de entorno (Build time injection)
        // Usamos try/catch para permitir que el bundler reemplace las variables si existen,
        // pero evitando que la app crashee si 'process' no está definido en el navegador.
        try {
          url = process.env.REACT_APP_SUPABASE_URL || '';
          key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';
        } catch (e) {
          // Ignoramos error si process no está definido, url/key seguirán vacíos
        }

        // 2. Intentar cargar configuración del servidor (Runtime injection) si no hay env vars
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
              detectSessionInUrl: true, // CRÍTICO para OAuth
              storageKey: 'donia-auth-token-v1',
              flowType: 'implicit'
            }
          });
        } else {
          console.error("[AuthService] Missing Supabase Configuration. Please check .env or api/config.");
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
    if (!this.client) throw new Error("Servicio de autenticación no disponible.");
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
    if (!this.client) throw new Error("Servicio de autenticación no disponible.");
    const { data, error } = await this.client.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    await this.initialize();
    if (!this.client) throw new Error("Servicio de autenticación no disponible.");
    
    // Usamos origin limpio. Supabase añadirá el hash.
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
