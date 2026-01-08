
import { SupabaseClient } from '@supabase/supabase-js';
import { CampaignData, Donation, FinancialSummary, Withdrawal, CampaignStatus } from '../types';
import { AuthService } from './AuthService';

export class CampaignService {
  private static instance: CampaignService;
  private aiEnabled: boolean = false;

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
    await AuthService.getInstance().initialize();
    try {
      const resp = await fetch('/api/config');
      if (resp.ok) {
        const config = await resp.json();
        this.aiEnabled = !!config.aiEnabled;
      }
    } catch (e) {
      console.error("[CampaignService] Error init:", e);
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
      imagenUrl: c.imagen_url || c.imagenUrl || 'https://picsum.photos/800/600',
      estado: c.estado as CampaignStatus || 'activa',
      donantesCount: Number(c.donantes_count || c.donantesCount || 0),
      beneficiarioNombre: c.beneficiario_nombre || c.beneficiarioNombre,
      beneficiarioRelacion: c.beneficiario_relacion || c.beneficiarioRelacion,
      owner_id: c.owner_id, // Usamos owner_id
      donations: c.donations ? c.donations.map((d: any) => ({
        id: d.id,
        campaignId: d.campaign_id,
        monto: Number(d.monto),
        fecha: d.fecha || d.created_at,
        nombreDonante: d.nombre_donante || d.donor_name || 'Anónimo',
        emailDonante: d.donor_email || '', // Mapeo del nuevo campo
        comentario: d.comentario,
        donorUserId: d.donor_user_id
      })) : undefined
    };
  }

  async getCampaigns(): Promise<CampaignData[]> {
    await this.initialize();
    try {
      const resp = await fetch('/api/campaigns');
      const json = await resp.json();
      return (json.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e) { return []; }
  }

  async getUserCampaigns(userId: string): Promise<CampaignData[]> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/user-campaigns?userId=${userId}`);
      const json = await resp.json();
      return (json.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e) { return []; }
  }

  async getUserDonations(userId: string): Promise<Donation[]> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/user-donations?userId=${userId}`);
      const json = await resp.json();
      return json.data || [];
    } catch (e) { return []; }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/campaigns?id=${id}`);
      const json = await resp.json();
      return json.success ? this.mapCampaign(json.data) : null;
    } catch (e) { return null; }
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

  async updateCampaignStatus(id: string, userId: string, estado: CampaignStatus): Promise<boolean> {
    return !!(await this.updateCampaign(id, userId, { estado }));
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

  async getFinancialSummary(userId: string): Promise<FinancialSummary> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/financial-summary?userId=${userId}&type=summary`);
      const json = await resp.json();
      return json.data || { totalRecaudado: 0, disponibleRetiro: 0, enProceso: 0, totalRetirado: 0 };
    } catch (e) { return { totalRecaudado: 0, disponibleRetiro: 0, enProceso: 0, totalRetirado: 0 }; }
  }

  async getWithdrawals(userId: string): Promise<Withdrawal[]> {
    await this.initialize();
    try {
      const resp = await fetch(`/api/withdrawals?userId=${userId}`);
      const json = await resp.json();
      return json.data || [];
    } catch (e) { return []; }
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
    } catch (e) { return story; }
  }

  async processPayment(paymentData: any, campaignId: string, metadata: any): Promise<any> {
    await this.initialize();
    // metadata debe incluir { nombre, email, comentario, tip, iva, donorUserId }
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentData, campaignId, metadata })
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error || 'Error procesando el pago');
    return json;
  }

  // Nuevo método para simular donación
  async simulateDonation(payload: { 
    campaignId: string, 
    monto: number, 
    nombre: string, 
    email: string, 
    comentario: string, 
    donorUserId?: string | null 
  }): Promise<boolean> {
    await this.initialize();
    const response = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!json.success) throw new Error(json.error);
    return true;
  }

  async uploadImage(base64: string, fileName: string): Promise<string> {
    await this.initialize();
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, name: fileName })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.url;
  }
}
