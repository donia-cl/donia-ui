
import { CampaignData, Donation } from '../types';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Función auxiliar para obtener variables de entorno de forma segura en el navegador
const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore - Intento de lectura de globales inyectadas por algunos entornos
  if (typeof window !== 'undefined' && window._env_ && window._env_[key]) {
    // @ts-ignore
    return window._env_[key];
  }
  return undefined;
};

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY');
const GEMINI_KEY = getEnv('API_KEY');

export class CampaignService {
  private static instance: CampaignService;
  private ai: GoogleGenAI | null = null;
  private supabase: SupabaseClient | null = null;
  private isLocalMode: boolean = false;
  private isAiAvailable: boolean = false;

  private constructor() {
    // Inicialización de IA
    if (GEMINI_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
        this.isAiAvailable = true;
        console.log("Donia: IA configurada correctamente.");
      } catch (e) {
        console.error("Donia AI Init Error:", e);
      }
    }
    
    // Inicialización de Supabase
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.isLocalMode = false;
        console.log("Donia: Cloud Sync activado.");
      } catch (err) {
        console.warn("Donia: Error al conectar con Supabase.", err);
        this.isLocalMode = true;
      }
    } else {
      console.warn("Donia: Faltan llaves de Supabase. Usando Local Mode.");
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
