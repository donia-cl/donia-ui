
import { CampaignData, Donation } from '../types';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Función robusta para obtener variables de entorno en cualquier contexto.
 * Busca con prefijos comunes (REACT_APP_, VITE_, NEXT_PUBLIC_) para asegurar compatibilidad en producción.
 */
const getEnv = (key: string): string | undefined => {
  const prefixes = ['', 'REACT_APP_', 'VITE_', 'NEXT_PUBLIC_'];
  
  // 1. Intentar via process.env (Webpack, CRA, Vercel Build-time)
  try {
    if (typeof process !== 'undefined' && process.env) {
      for (const p of prefixes) {
        const val = (process.env as any)[`${p}${key}`];
        if (val) return val;
      }
    }
  } catch (e) {}

  // 2. Intentar via import.meta.env (Vite nativo)
  try {
    // @ts-ignore
    const viteEnv = import.meta.env;
    if (viteEnv) {
      for (const p of prefixes) {
        const val = viteEnv[`${p}${key}`];
        if (val) return val;
      }
    }
  } catch (e) {}

  return undefined;
};

export class CampaignService {
  private static instance: CampaignService;
  private supabase: SupabaseClient | null = null;
  private isLocalMode: boolean = false;
  private isAiAvailable: boolean = false;

  private constructor() {
    // Detección de llaves de Supabase con fallback de prefijos
    const sUrl = getEnv('SUPABASE_URL');
    const sKey = getEnv('SUPABASE_ANON_KEY');
    
    // Acceso seguro a API_KEY según instrucciones estrictas (exclusivamente process.env.API_KEY)
    let gKey: string | undefined;
    try {
      // Verificamos existencia de process para no romper la ejecución si no está definido
      gKey = typeof process !== 'undefined' ? (process.env?.API_KEY || (process.env as any)?.REACT_APP_API_KEY) : undefined;
    } catch (e) {
      gKey = undefined;
    }

    // Diagnóstico en consola para el desarrollador
    console.group("🚀 Donia Connection Diagnostics");
    console.log("Supabase URL:", sUrl ? "✅ Detectada" : "❌ No encontrada");
    console.log("Supabase Key:", sKey ? "✅ Detectada" : "❌ No encontrada");
    console.log("Gemini API Key:", gKey ? "✅ Detectada" : "❌ No encontrada");
    console.log("Modo de Operación:", sUrl && sKey ? "🌐 Nube (Supabase)" : "🏠 Local (LocalStorage)");
    console.groupEnd();

    // Verificación de disponibilidad de IA
    if (gKey) {
      this.isAiAvailable = true;
    }
    
    // Inicialización de Supabase
    if (sUrl && sKey) {
      try {
        this.supabase = createClient(sUrl, sKey);
        this.isLocalMode = false;
      } catch (err) {
        console.error("Error al inicializar Supabase:", err);
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
        console.error("Error al obtener campañas de Supabase:", e);
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
        console.error("Error al obtener campaña por ID:", e);
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
        console.error("Error al crear campaña en Supabase:", e);
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
        console.error("Error al procesar donación en Supabase:", e);
      }
    }

    const campaigns = this.getLocalCampaigns();
    const index = campaigns.findIndex(c => c.id === campaignId);
    if (index !== -1) {
      campaigns[index].recaudado += monto;
      campaigns[index].donantesCount += 1;
      this.saveLocalCampaigns(campaigns);
      return {
        id: Math.random().toString(36).substr(2, 9),
        campaignId,
        monto,
        nombreDonante: nombre,
        fecha: new Date().toISOString()
      };
    }
    throw new Error("Campaña no encontrada");
  }

  /**
   * Mejora la narrativa de la campaña utilizando Gemini AI.
   */
  async polishStory(story: string): Promise<string> {
    try {
      // Obtenemos la llave de manera segura antes de instanciar
      const apiKey = typeof process !== 'undefined' ? (process.env?.API_KEY || (process.env as any)?.REACT_APP_API_KEY) : undefined;
      
      if (!apiKey) {
        console.warn("Gemini API Key no disponible para pulir historia.");
        return story;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Por favor, mejora y pulé el siguiente relato de una campaña de recaudación de fondos para que sea más emotivo y profesional, pero manteniendo la esencia original. El texto está en español: "${story}"`,
        config: {
          systemInstruction: "Eres un experto en copywriting para causas benéficas y organizaciones sin fines de lucro. Devuelve solo el texto pulido, sin introducciones ni comentarios adicionales.",
        },
      });
      return response.text || story;
    } catch (e) {
      console.error("Error al pulir la historia con Gemini:", e);
      return story;
    }
  }
}
