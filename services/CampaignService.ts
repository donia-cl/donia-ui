
import { SupabaseClient } from '@supabase/supabase-js';
import { CampaignData, Donation, FinancialSummary, Withdrawal, CampaignStatus } from '../types';
import { AuthService } from './AuthService';

export class CampaignService {
  private static instance: CampaignService;
  private aiEnabled: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  private get supabase(): SupabaseClient | null {
    return AuthService.getInstance().getSupabase();
  }

  public async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    try {
       await AuthService.getInstance().initialize();
    } catch (e) { /* ignore */ }

    // Fetch de configuración sin AbortController
    this.fetchServerConfig().catch(() => { /* Silent fail */ });

    this.initPromise = Promise.resolve();
    return this.initPromise;
  }

  private async fetchServerConfig() {
     try {
        const resp = await fetch('/api/config', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (resp.ok) {
          const config = await resp.json();
          this.aiEnabled = !!config.aiEnabled;
        }
      } catch (netError: any) {
        this.aiEnabled = false; 
      }
  }

  public checkAiAvailability(): boolean { return this.aiEnabled; }
  public getConnectionStatus(): 'cloud' | 'local' { return this.supabase ? 'cloud' : 'local'; }

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
      fechaTermino: c.fecha_termino || c.fechaTermino,
      duracionDias: c.duracion_dias || c.duracionDias,
      imagenUrl: c.imagen_url || c.imagenUrl || 'https://picsum.photos/800/600',
      estado: c.estado as CampaignStatus || 'activa',
      donantesCount: Number(c.donantes_count || c.donantesCount || 0),
      beneficiarioNombre: c.beneficiario_nombre || c.beneficiarioNombre,
      beneficiarioRelacion: c.beneficiario_relacion || c.beneficiarioRelacion,
      owner_id: c.owner_id,
      donations: c.donations ? c.donations.map((d: any) => ({
        id: d.id,
        campaignId: d.campaign_id,
        monto: Number(d.monto),
        fecha: d.fecha || d.created_at,
        nombreDonante: d.nombre_donante || d.donor_name || 'Anónimo',
        emailDonante: d.donor_email || '',
        comentario: d.comentario,
        donorUserId: d.donor_user_id
      })) : undefined
    };
  }

  async getCampaigns(): Promise<CampaignData[]> {
    await this.initialize();
    try {
      const resp = await fetch('/api/campaigns');
      if (!resp.ok) return [];
      const json = await resp.json();
      return (json.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e) { return []; }
  }

  async getUserCampaigns(userId: string): Promise<CampaignData[]> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/user-campaigns?userId=${userId}`);
      if (!resp.ok) return [];
      const json = await resp.json();
      return (json.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e) { return []; }
  }

  async getUserDonations(userId: string): Promise<Donation[]> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/user-donations?userId=${userId}`);
      if (!resp.ok) return [];
      const json = await resp.json();
      return json.data || [];
    } catch (e) { return []; }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/campaigns?id=${id}`);
      if (!resp.ok) return null;
      const json = await resp.json();
      if (!json.success || !json.data) return null;
      return this.mapCampaign(json.data);
    } catch (e) { 
      return null; 
    }
  }

  async createCampaign(campaign: Partial<CampaignData>): Promise<CampaignData> {
      await this.initialize();
      const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaign)
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Error creating campaign');
      return this.mapCampaign(json.data);
  }

  async updateCampaign(id: string, userId: string, updates: Partial<CampaignData>): Promise<CampaignData> {
      await this.initialize();
      const response = await fetch('/api/update-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, userId, updates })
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Error updating campaign');
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
      if (!json.success) throw new Error(json.error || 'Error deleting campaign');
      return true;
  }

  async uploadImage(base64: string, name: string): Promise<string> {
      await this.initialize();
      try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, name })
        });
        
        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            throw new Error(`Error del servidor (${response.status})`);
        }

        if (!json.success) throw new Error(json.error || 'Error uploading image');
        return json.url;
      } catch (err: any) {
        console.error("Upload failed:", err);
        throw err;
      }
  }

  async polishStory(story: string): Promise<string> {
      await this.initialize();
      if (!this.aiEnabled) return story;
      try {
          const response = await fetch('/api/polish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ story })
          });
          const json = await response.json();
          return json.text || story;
      } catch (e) {
          return story;
      }
  }

  async processPayment(paymentData: any, campaignId: string, metadata: any): Promise<any> {
      await this.initialize();
      const response = await fetch('/api/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentData, campaignId, metadata })
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Payment failed');
      return json;
  }

  async simulateDonation(data: any): Promise<void> {
      await this.initialize();
      const response = await fetch('/api/donate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
      });
      const json = await response.json();
      if (!json.success) throw new Error(json.error || 'Simulated donation failed');
  }

  async getFinancialSummary(userId: string): Promise<FinancialSummary> {
      await this.initialize();
      const response = await fetch(`/api/financial-summary?userId=${userId}&type=summary`);
      if (!response.ok) throw new Error('Failed to fetch financial summary');
      const json = await response.json();
      return json.data;
  }

  async getWithdrawals(userId: string): Promise<Withdrawal[]> {
      await this.initialize();
      const response = await fetch(`/api/withdrawals?userId=${userId}`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
  }
}
