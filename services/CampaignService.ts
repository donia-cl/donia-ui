
import { CampaignData, Donation } from '../types';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Intentamos obtener las variables de entorno de forma segura
const SUPABASE_URL = typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined;
const SUPABASE_ANON_KEY = typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined;

export class CampaignService {
  private static instance: CampaignService;
  private ai: GoogleGenAI;
  private supabase: SupabaseClient | null = null;
  private isLocalMode: boolean = false;

  private constructor() {
    // Fixed: Always use direct process.env.API_KEY for GoogleGenAI initialization
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Donia: Conectado a PostgreSQL (Supabase)");
      } catch (err) {
        console.warn("Donia: Error al conectar a Supabase, activando modo local.", err);
        this.isLocalMode = true;
      }
    } else {
      this.isLocalMode = true;
      console.info(
        "Donia (Info): Ejecutando en modo local. \n" +
        "Para usar PostgreSQL real, configura SUPABASE_URL y SUPABASE_ANON_KEY en Vercel."
      );
    }
  }

  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  // --- AYUDANTES DE STORAGE LOCAL (Fallback) ---

  private getLocalCampaigns(): CampaignData[] {
    const data = localStorage.getItem('donia_campaigns');
    return data ? JSON.parse(data) : [];
  }

  private saveLocalCampaigns(campaigns: CampaignData[]) {
    localStorage.setItem('donia_campaigns', JSON.stringify(campaigns));
  }

  // --- MÉTODOS DE CAMPAÑA ---

  async getCampaigns(): Promise<CampaignData[]> {
    if (this.supabase && !this.isLocalMode) {
      const { data, error } = await this.supabase
        .from('campaigns')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (!error && data) {
        return data.map(c => ({
          id: c.id,
          titulo: c.titulo,
          historia: c.historia,
          monto: c.monto,
          recaudado: c.recaudado,
          categoria: c.categoria,
          ubicacion: c.ubicacion,
          fechaCreacion: c.fecha_creacion,
          imagenUrl: c.imagen_url,
          estado: c.estado,
          donantesCount: c.donantes_count
        }));
      }
    }
    // Fallback Local
    return this.getLocalCampaigns();
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    if (this.supabase && !this.isLocalMode) {
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
          monto: data.monto,
          recaudado: data.recaudado,
          categoria: data.categoria,
          ubicacion: data.ubicacion,
          fechaCreacion: data.fecha_creacion,
          imagenUrl: data.imagen_url,
          estado: data.estado,
          donantesCount: data.donantes_count
        };
      }
    }
    return this.getLocalCampaigns().find(c => c.id === id) || null;
  }

  async createCampaign(payload: Omit<CampaignData, 'id' | 'recaudado' | 'fechaCreacion' | 'estado' | 'donantesCount' | 'imagenUrl'>): Promise<CampaignData> {
    const imagenUrl = `https://picsum.photos/seed/${Math.random()}/1200/800`;
    
    if (this.supabase && !this.isLocalMode) {
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
          monto: data.monto,
          recaudado: data.recaudado,
          categoria: data.categoria,
          ubicacion: data.ubicacion,
          fechaCreacion: data.fecha_creacion,
          imagenUrl: data.imagen_url,
          estado: data.estado,
          donantesCount: data.donantes_count
        };
      }
    }

    // Fallback Local
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
    }

    // Fallback Local
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
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Actúa como un experto en storytelling para recaudación de fondos solidarios en Chile. 
        Toma este borrador de historia y mejóralo para que sea más emotivo, claro y transparente. 
        Usa párrafos cortos y una estructura narrativa de: El Problema, El Impacto de la Ayuda y El Llamado a la Acción.
        
        Borrador: "${draft}"`,
      });
      // Fixed: Extracting text output correctly using the .text property
      return response.text || draft;
    } catch (error) {
      console.warn("IA Polish error (usando borrador original):", error);
      return draft;
    }
  }
}
