
import { CampaignData, Donation } from '../types';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Intentamos capturar las variables directamente. 
// En entornos de producción como Vercel, el bundler reemplaza estos valores durante el build.
const getSupabaseUrl = () => {
  try { return process.env.SUPABASE_URL; } catch { return undefined; }
};
const getSupabaseKey = () => {
  try { return process.env.SUPABASE_ANON_KEY; } catch { return undefined; }
};
const getGeminiKey = () => {
  try { return process.env.API_KEY; } catch { return undefined; }
};

export class CampaignService {
  private static instance: CampaignService;
  private ai: GoogleGenAI | null = null;
  private supabase: SupabaseClient | null = null;
  private isLocalMode: boolean = false;
  private isAiAvailable: boolean = false;

  private constructor() {
    const sUrl = getSupabaseUrl();
    const sKey = getSupabaseKey();
    const gKey = getGeminiKey();

    console.log("Donia Debug - Supabase URL exists:", !!sUrl);
    console.log("Donia Debug - Supabase Key exists:", !!sKey);
    console.log("Donia Debug - Gemini Key exists:", !!gKey);

    // Inicialización de IA
    if (gKey && gKey !== "") {
      try {
        this.ai = new GoogleGenAI({ apiKey: gKey });
        this.isAiAvailable = true;
      } catch (e) {
        console.error("Donia AI Init Error:", e);
      }
    }
    
    // Inicialización de Supabase
    if (sUrl && sKey && sUrl !== "" && sKey !== "") {
      try {
        this.supabase = createClient(sUrl, sKey);
        this.isLocalMode = false;
      } catch (err) {
        console.warn("Donia Connection Error:", err);
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
        if (error) console.error("Supabase Query Error:", error);
      } catch (e) {
        console.error("Fetch failed:", e);
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
        console.error("Single fetch error:", e);
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
        if (error) console.error("Supabase Insert Error:", error);
      } catch (e) {
        console.error("Insert error:", e);
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
        console.error("Donation error:", e);
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
