
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CampaignData, Donation } from '../types';

export class CampaignService {
  private static instance: CampaignService;
  private supabase: SupabaseClient | null = null;
  private initPromise: Promise<void> | null = null;
  private aiEnabled: boolean = false;

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

  public async initialize(): Promise<void> {
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
          }
          this.aiEnabled = !!config.aiEnabled;
        }
      } catch (e) {
        console.error("[CampaignService] Error en inicialización:", e);
      }
    })();

    return this.initPromise;
  }

  public checkAiAvailability(): boolean {
    return this.aiEnabled;
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
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, name: fileName })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      return data.url;
    } catch (e) {
      console.error("Error subiendo imagen:", e);
      throw e;
    }
  }

  async getCampaigns(): Promise<CampaignData[]> {
    await this.initialize();
    try {
      const resp = await fetch('/api/campaigns');
      const json = await resp.json();
      return (json.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e) {
      return [];
    }
  }

  async getUserCampaigns(userId: string): Promise<CampaignData[]> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/user-campaigns?userId=${userId}`);
      const json = await resp.json();
      return (json.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e) {
      return [];
    }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/campaign-detail?id=${id}`);
      const json = await resp.json();
      if (!json.success) return null;
      return this.mapCampaign(json.data);
    } catch (e) {
      return null;
    }
  }

  async createCampaign(payload: any): Promise<CampaignData> {
    await this.initialize();
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error);
    return this.mapCampaign(json.data);
  }

  async updateCampaign(id: string, userId: string, updates: any): Promise<CampaignData> {
    await this.initialize();
    const response = await fetch('/api/update-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId, updates })
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error);
    return this.mapCampaign(json.data);
  }

  async deleteCampaign(id: string, userId: string): Promise<boolean> {
    await this.initialize();
    const response = await fetch('/api/delete-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId })
    });
    const json = await response.json();
    return json.success;
  }

  async polishStory(story: string): Promise<string> {
    if (!this.aiEnabled) return story;
    try {
      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story }),
      });
      const data = await response.json();
      return data.text || story;
    } catch (e) {
      return story;
    }
  }

  // Fix: Added processPayment method to handle Mercado Pago payment processing
  async processPayment(paymentData: any, campaignId: string, metadata: any): Promise<any> {
    await this.initialize();
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentData, campaignId, metadata })
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error || 'Error procesando el pago');
    return json;
  }
}
