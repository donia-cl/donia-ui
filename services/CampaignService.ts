
import { CampaignData, Donation } from '../types';

export class CampaignService {
  private static instance: CampaignService;

  private constructor() {
    console.group("Donia System Check");
    console.log("Database & AI Services:", "Delegados a Backend Secure Endpoints (/api/*)");
    console.groupEnd();
  }

  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  public checkAiAvailability(): boolean {
    return true; 
  }

  public getConnectionStatus(): 'cloud' | 'local' {
    return 'cloud';
  }

  private mapCampaign(c: any): CampaignData {
    if (!c) throw new Error("Datos de campaña nulos");
    return {
      id: c.id || String(Math.random()),
      titulo: c.titulo || 'Sin título',
      historia: c.historia || '',
      monto: Number(c.monto || 0),
      recaudado: Number(c.recaudado || 0),
      categoria: c.categoria || 'General',
      ubicacion: c.ubicacion || 'Chile',
      fechaCreacion: c.fecha_creacion || c.fechaCreacion || new Date().toISOString(),
      imagenUrl: c.imagen_url || c.imagenUrl || 'https://picsum.photos/800/600',
      estado: c.estado || 'activa',
      donantesCount: Number(c.donantes_count || c.donantesCount || 0)
    };
  }

  private async safeParseJson(response: Response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Error al parsear JSON. Respuesta del servidor:", text);
      throw new Error("El servidor no devolvió un JSON válido. Revisa los logs de la API.");
    }
  }

  async getCampaigns(): Promise<CampaignData[]> {
    try {
      const response = await fetch('/api/campaigns');
      const result = await this.safeParseJson(response);
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Fallo en la carga de campañas');
      }
      
      return (result.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e: any) {
      console.error("Donia Fetch Error:", e.message);
      const local = localStorage.getItem('donia_campaigns');
      return local ? JSON.parse(local).map((c: any) => this.mapCampaign(c)) : [];
    }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    try {
      const response = await fetch(`/api/campaign-detail?id=${id}`);
      const result = await this.safeParseJson(response);
      if (!response.ok || !result.success) return null;
      return this.mapCampaign(result.data);
    } catch (e) {
      return null;
    }
  }

  async createCampaign(payload: Omit<CampaignData, 'id' | 'recaudado' | 'fechaCreacion' | 'estado' | 'donantesCount' | 'imagenUrl'>): Promise<CampaignData> {
    const imagenUrl = `https://picsum.photos/seed/${Math.random()}/1200/800`;
    
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, imagen_url: imagenUrl }),
    });

    const result = await this.safeParseJson(response);

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.details || 'Error al guardar en la nube');
    }

    return this.mapCampaign(result.data);
  }

  async donate(campaignId: string, monto: number, nombre: string = 'Anónimo'): Promise<Donation> {
    const response = await fetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, monto, nombre }),
    });

    const result = await this.safeParseJson(response);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Error al procesar donación');
    }

    const donation = result.data;
    return {
      id: donation.id,
      campaignId: donation.campaign_id,
      monto: donation.monto,
      nombreDonante: donation.nombre_donante,
      fecha: donation.fecha
    };
  }

  async polishStory(story: string): Promise<string> {
    try {
      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story }),
      });
      const data = await this.safeParseJson(response);
      return data.text || story;
    } catch (e) {
      return story;
    }
  }
}
