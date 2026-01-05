
import { CampaignData, Donation } from '../types';

export class CampaignService {
  private static instance: CampaignService;

  private constructor() {}

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

  private async safeFetch(url: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}`);
      }
      const result = await response.json();
      if (result.success === false) throw new Error(result.error);
      return result;
    } catch (e: any) {
      console.error(`[CampaignService] Error en ${url}:`, e.message);
      throw e;
    }
  }

  async uploadImage(base64: string, fileName: string): Promise<string> {
    const result = await this.safeFetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, name: fileName }),
    });
    return result.url;
  }

  async getCampaigns(): Promise<CampaignData[]> {
    try {
      const result = await this.safeFetch('/api/campaigns');
      return (result.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e) {
      return [];
    }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    try {
      const result = await this.safeFetch(`/api/campaign-detail?id=${id}`);
      return this.mapCampaign(result.data);
    } catch (e) {
      return null;
    }
  }

  async createCampaign(payload: any): Promise<CampaignData> {
    const result = await this.safeFetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return this.mapCampaign(result.data);
  }

  async donate(campaignId: string, monto: number, nombre: string, comentario: string): Promise<Donation> {
    const result = await this.safeFetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, monto, nombre, comentario }),
    });
    return result.data;
  }

  async polishStory(story: string): Promise<string> {
    try {
      const result = await this.safeFetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story }),
      });
      return result.text || story;
    } catch (e) {
      return story;
    }
  }
}
