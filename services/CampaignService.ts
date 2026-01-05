
import { CampaignData, Donation } from '../types';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Buscador universal de variables de entorno.
 * Intenta encontrar la configuración sin importar qué prefijo use el hosting (Vercel/Netlify).
 */
const getEnv = (key: string): string | undefined => {
  const prefixes = ['', 'NEXT_PUBLIC_', 'REACT_APP_', 'VITE_'];
  
  try {
    // 1. Buscar en process.env (Vercel/CRA)
    for (const p of prefixes) {
      const val = (process.env as any)[`${p}${key}`];
      if (val) return val;
    }

    // 2. Casos especiales de nombres (como se vio en la captura del usuario)
    if (key === 'SUPABASE_ANON_KEY') {
      const special = (process.env as any)['REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY'];
      if (special) return special;
    }

    // 3. Fallback para import.meta.env (Vite)
    for (const p of prefixes) {
      const val = (import.meta as any).env?.[`${p}${key}`];
      if (val) return val;
    }
  } catch (e) {
    // Silencioso
  }
  return undefined;
};

export class CampaignService {
  private static instance: CampaignService;
  private ai: GoogleGenAI | null = null;
  private supabase: SupabaseClient | null = null;
  private isLocalMode: boolean = false;
  private isAiAvailable: boolean = false;

  private constructor() {
    // Intentamos obtener las variables con sus nombres base
    const sUrl = getEnv('SUPABASE_URL');
    const sKey = getEnv('SUPABASE_ANON_KEY');
    const gKey = getEnv('API_KEY');

    console.group("🔍 Diagnóstico de Conexión Donia");
    console.log("Supabase URL:", sUrl ? "✅ OK" : "❌ No encontrada");
    console.log("Supabase Key:", sKey ? "✅ OK" : "❌ No encontrada");
    console.log("Gemini API Key:", gKey ? "✅ OK" : "❌ No encontrada");
    console.groupEnd();

    // Inicialización de IA
    if (gKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey: gKey });
        this.isAiAvailable = true;
      } catch (e) {
        console.error("Error IA:", e);
      }
    }
    
    // Inicialización de Supabase
    if (sUrl && sKey) {
      try {
        this.supabase = createClient(sUrl, sKey);
        this.isLocalMode = false;
        console.log("📡 Conectado a Supabase");
      } catch (err) {
        console.error("Error Supabase:", err);
        this.isLocalMode = true;
      }
    } else {
      this.isLocalMode = true;
    }
  }

  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  public checkAiAvailability(): boolean {
    return this.isAiAvailable;
  }

  public getConnectionStatus(): 'cloud' | 'local' {
    return this.isLocalMode ? 'local' : 'cloud';
  }

  private getLocalCampaigns(): CampaignData[] {
    const data = localStorage.getItem('donia_campaigns');
    return data ? JSON.parse(data) : [];
  }

  private saveLocalCampaigns(campaigns: CampaignData[]) {
    localStorage.setItem('donia_campaigns', JSON.stringify(campaigns));
  }

  async getCampaigns(): Promise<CampaignData[]> {
    if (this.supabase && !this.isLocalMode) {
      try {
        const { data, error } = await this.supabase
          .from('campaigns')
          .select('*')
          .order('fecha_creacion', { ascending: false });

        if (!error && data) {
          return data.map(c => ({
            id: c.id,
            titulo: c.titulo,
            historia: c.historia,
            monto: Number(c.monto),
            recaudado: Number(c.recaudado),
            categoria: c.categoria,
            ubicacion: c.ubicacion,
            fechaCreacion: c.fecha_creacion,
            imagenUrl: c.imagen_url,
            estado: c.estado,
            donantesCount: c.donantes_count
          }));
        }
      } catch (e) {
        console.error("Fetch error:", e);
      }
    }
    return this.getLocalCampaigns();
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    if (this.supabase && !this.isLocalMode) {
      try {
        const { data, error } = await this.supabase
          .from('campaigns')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            titulo: data.titulo,
            historia: data.historia,
            monto: Number(data.monto),
            recaudado: Number(data.recaudado),
            categoria: data.categoria,
            ubicacion: data.ubicacion,
            fechaCreacion: data.fecha_creacion,
            imagenUrl: data.imagen_url,
            estado: data.estado,
            donantesCount: data.donantes_count
          };
        }
      } catch (e) {
        console.error("GetById error:", e);
      }
    }
    return this.getLocalCampaigns().find(c => c.id === id) || null;
  }

  async createCampaign(payload: Omit<CampaignData, 'id' | 'recaudado' | 'fechaCreacion' | 'estado' | 'donantesCount' | 'imagenUrl'>): Promise<CampaignData> {
    const imagenUrl = `https://picsum.photos/seed/${Math.random()}/1200/800`;
    
    if (this.supabase && !this.isLocalMode) {
      try {
        const { data, error } = await this.supabase
          .from('campaigns')
          .insert([{
            titulo: payload.titulo,
            historia: payload.historia,
            monto: payload.monto,
            categoria: payload.categoria,
            ubicacion: payload.ubicacion,
            imagen_url: imagenUrl
          }])
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            titulo: data.titulo,
            historia: data.historia,
            monto: Number(data.monto),
            recaudado: Number(data.recaudado),
            categoria: data.categoria,
            ubicacion: data.ubicacion,
            fechaCreacion: data.fecha_creacion,
            imagenUrl: data.imagen_url,
            estado: data.estado,
            donantesCount: data.donantes_count
          };
        }
      } catch (e) {
        console.error("Create error:", e);
      }
    }

    const newCampaign: CampaignData = {
      ...payload,
      id: Math.random().toString(36).substr(2, 9),
      recaudado: 0,
      donantesCount: 0,
      fechaCreacion: new Date().toISOString(),
      estado: 'activa',
      imagenUrl
    };

    const all = this.getLocalCampaigns();
    this.saveLocalCampaigns([newCampaign, ...all]);
    return newCampaign;
  }

  async donate(campaignId: string, monto: number, nombre: string = 'Anónimo'): Promise<Donation> {
    if (this.supabase && !this.isLocalMode) {
      try {
        const { data: donation, error: dError } = await this.supabase
          .from('donations')
          .insert([{ campaign_id: campaignId, monto, nombre_donante: nombre }])
          .select()
          .single();

        if (!dError && donation) {
          const current = await this.getCampaignById(campaignId);
          if (current) {
            await this.supabase
              .from('campaigns')
              .update({
                recaudado: (current.recaudado || 0) + monto,
                donantes_count: (current.donantesCount || 0) + 1
              })
              .eq('id', campaignId);
          }
          return {
            id: donation.id,
            campaignId: donation.campaign_id,
            monto: donation.monto,
            nombreDonante: donation.nombre_donante,
            fecha: donation.fecha
          };
        }
      } catch (e) {
        console.error("Donate error:", e);
      }
    }

    const campaigns = this.getLocalCampaigns();
    const index = campaigns.findIndex(c => c.id === campaignId);
    if (index !== -1) {
      campaigns[index].recaudado += monto;
      campaigns[index].donantesCount += 1;
      this.saveLocalCampaigns(campaigns);
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      campaignId,
      monto,
      nombreDonante: nombre,
      fecha: new Date().toISOString()
    };
  }

  async polishStory(draft: string): Promise<string> {
    if (!this.ai || !this.isAiAvailable) return draft;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Actúa como un experto en storytelling para recaudación de fondos solidarios en Chile. 
        Toma este borrador de historia y mejóralo para que sea más emotivo, claro y transparente. 
        Usa párrafos cortos y una estructura narrativa de: El Problema, El Impacto de la Ayuda y El Llamado a la Acción.
        
        Borrador: "${draft}"`,
      });
      return response.text || draft;
    } catch (error) {
      return draft;
    }
  }
}
