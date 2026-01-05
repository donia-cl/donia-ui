
import { CampaignData, Donation } from '../types';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class CampaignService {
  private static instance: CampaignService;
  private supabase: SupabaseClient | null = null;
  private isLocalMode: boolean = false;

  private constructor() {
    // Intentar obtener variables de proceso (Vercel/Node/CRA)
    const env = (window as any).process?.env || process.env || {};
    
    // Lista de posibles nombres para la URL de Supabase
    const sUrl = env.REACT_APP_SUPABASE_URL || 
                 env.SUPABASE_URL || 
                 env.NEXT_PUBLIC_SUPABASE_URL;
                 
    // Lista de posibles nombres para la Key de Supabase (Anon/Publishable)
    const sKey = env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                 env.REACT_APP_SUPABASE_ANON_KEY || 
                 env.SUPABASE_ANON_KEY ||
                 env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Diagnóstico en consola para el desarrollador
    console.group("Donia System Check");
    console.log("Supabase URL Detectada:", sUrl ? "✅ OK" : "❌ No encontrada");
    console.log("Supabase Key Detectada:", sKey ? "✅ OK" : "❌ No encontrada");
    console.log("Gemini API Key Detectada:", (env.API_KEY || env.REACT_APP_API_KEY) ? "✅ OK" : "❌ No encontrada");
    console.groupEnd();

    if (sUrl && sKey) {
      try {
        this.supabase = createClient(sUrl, sKey);
        this.isLocalMode = false;
        console.log("Donia: Conectado a Supabase Cloud.");
      } catch (err) {
        console.warn("Donia: Error al inicializar Supabase. Usando LocalMode.");
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
    const env = (window as any).process?.env || process.env || {};
    return !!(env.API_KEY || env.REACT_APP_API_KEY);
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
        console.error("Donia Fetch Error:", e);
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
        console.error("Donia Detail Error:", e);
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
        console.error("Donia Creation Error:", e);
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
        console.error("Donia Donation Error:", e);
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

  async polishStory(story: string): Promise<string> {
    const env = (window as any).process?.env || process.env || {};
    const apiKey = env.API_KEY || env.REACT_APP_API_KEY;
    if (!apiKey) return story;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Mejora y humaniza este texto para una campaña solidaria en Chile: "${story}"`,
        config: {
          systemInstruction: "Eres un redactor experto en causas sociales. Hazlo empático.",
          temperature: 0.7,
        },
      });

      return response.text || story;
    } catch (e) {
      console.error("Donia AI Error:", e);
      return story;
    }
  }
}
