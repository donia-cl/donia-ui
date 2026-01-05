
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import { CampaignData, Donation } from '../types';

export class CampaignService {
  private static instance: CampaignService;
  private supabase: SupabaseClient | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  /**
   * Garantiza que la configuración se cargue una sola vez y 
   * permite que otros métodos esperen a que termine.
   */
  public async initialize(): Promise<void> {
    if (this.supabase) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const resp = await fetch('/api/config');
        if (resp.ok) {
          const config = await resp.json();
          const url = config.supabaseUrl || process.env.REACT_APP_SUPABASE_URL;
          const key = config.supabaseKey || process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

          if (url && key) {
            this.supabase = createClient(url, key);
            console.log("[CampaignService] Conectado a Supabase.");
          }
        }
      } catch (e) {
        console.error("[CampaignService] Error en inicialización:", e);
      }
    })();

    return this.initPromise;
  }

  public checkAiAvailability(): boolean {
    return !!process.env.API_KEY;
  }

  public getConnectionStatus(): 'cloud' | 'local' {
    return this.supabase ? 'cloud' : 'local';
  }

  private mapCampaign(c: any): CampaignData {
    return {
      id: c.id,
      titulo: c.titulo || 'Sin título',
      historia: c.historia || '',
      monto: Number(c.monto || 0),
      recaudado: Number(c.recaudado || 0),
      categoria: c.categoria || 'General',
      ubicacion: c.ubicacion || 'Chile',
      fechaCreacion: c.fecha_creacion || c.fechaCreacion || new Date().toISOString(),
      imagenUrl: c.imagen_url || c.imagenUrl || 'https://picsum.photos/800/600',
      estado: c.estado || 'activa',
      donantesCount: Number(c.donantes_count || c.donantesCount || 0),
      beneficiarioNombre: c.beneficiario_nombre || c.beneficiarioNombre,
      beneficiarioRelacion: c.beneficiario_relacion || c.beneficiarioRelacion,
      donations: c.donations ? c.donations.map((d: any) => ({
        id: d.id,
        campaignId: d.campaign_id,
        monto: Number(d.monto),
        fecha: d.fecha,
        nombreDonante: d.nombre_donante || 'Anónimo',
        comentario: d.comentario
      })) : undefined
    };
  }

  async uploadImage(base64: string, fileName: string): Promise<string> {
    await this.initialize();
    if (!this.supabase) throw new Error("Base de datos no disponible.");
    const base64Data = base64.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileExt = fileName.split('.').pop() || 'jpg';
    const path = `campaigns/${Date.now()}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from('campaign-images')
      .upload(path, binaryData, { contentType: 'image/jpeg', upsert: true });

    if (error) throw error;
    const { data: { publicUrl } } = this.supabase.storage.from('campaign-images').getPublicUrl(path);
    return publicUrl;
  }

  async getCampaigns(): Promise<CampaignData[]> {
    await this.initialize();
    if (!this.supabase) return [];
    try {
      const { data, error } = await this.supabase
        .from('campaigns')
        .select('*')
        .order('fecha_creacion', { ascending: false });
      if (error) throw error;
      return (data || []).map(c => this.mapCampaign(c));
    } catch (e) {
      console.error("Error obteniendo campañas:", e);
      return [];
    }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    await this.initialize();
    if (!this.supabase) return null;
    try {
      const { data: campaign, error: cError } = await this.supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      if (cError) throw cError;

      const { data: donations } = await this.supabase
        .from('donations')
        .select('*')
        .eq('campaign_id', id)
        .order('fecha', { ascending: false });

      return this.mapCampaign({ ...campaign, donations: donations || [] });
    } catch (e) {
      return null;
    }
  }

  async createCampaign(payload: any): Promise<CampaignData> {
    await this.initialize();
    if (!this.supabase) throw new Error("Base de datos no disponible.");
    const { data, error } = await this.supabase
      .from('campaigns')
      .insert([{
        titulo: payload.titulo,
        historia: payload.historia,
        monto: Number(payload.monto),
        categoria: payload.categoria,
        ubicacion: payload.ubicacion,
        imagen_url: payload.imagenUrl,
        beneficiario_nombre: payload.beneficiarioNombre,
        beneficiario_relacion: payload.beneficiarioRelacion,
        recaudado: 0,
        donantes_count: 0,
        estado: 'activa'
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapCampaign(data);
  }

  async processPayment(paymentData: any, campaignId: string, metadata: any): Promise<any> {
    try {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentData, campaignId, metadata }),
      });
      if (!response.ok) throw new Error("Error en API de pago");
      return await response.json();
    } catch (e) {
       console.warn("Simulando aprobación de pago.");
       return { status: 'approved' };
    }
  }

  async polishStory(story: string): Promise<string> {
    if (!process.env.API_KEY) return story;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Mejora y humaniza este texto para una campaña solidaria en Chile: "${story}"`,
        config: {
          systemInstruction: "Eres un redactor experto en causas sociales en Chile. Mejora el storytelling para que sea profesional y humano.",
          temperature: 0.7,
        },
      });

      return response.text || story;
    } catch (e) {
      return story;
    }
  }
}
