
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
    // Ahora siempre delegamos al backend, el cual maneja su propia conexión
    return 'cloud';
  }

  private getLocalCampaigns(): CampaignData[] {
    const data = localStorage.getItem('donia_campaigns');
    return data ? JSON.parse(data) : [];
  }

  private saveLocalCampaigns(campaigns: CampaignData[]) {
    localStorage.setItem('donia_campaigns', JSON.stringify(campaigns));
  }

  private mapCampaign(c: any): CampaignData {
    return {
      id: c.id,
      titulo: c.titulo,
      historia: c.historia,
      monto: Number(c.monto),
      recaudado: Number(c.recaudado),
      categoria: c.categoria,
      ubicacion: c.ubicacion,
      fechaCreacion: c.fecha_creacion || c.fechaCreacion,
      imagenUrl: c.imagen_url || c.imagenUrl,
      estado: c.estado,
      donantesCount: c.donantes_count || c.donantesCount
    };
  }

  async getCampaigns(): Promise<CampaignData[]> {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch from API');
      const data = await response.json();
      return data.map((c: any) => this.mapCampaign(c));
    } catch (e) {
      console.warn("Donia: Usando modo local como fallback.");
      return this.getLocalCampaigns();
    }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    try {
      const response = await fetch(`/api/campaign-detail?id=${id}`);
      if (!response.ok) throw new Error('Campaign not found');
      const data = await response.json();
      return this.mapCampaign(data);
    } catch (e) {
      return this.getLocalCampaigns().find(c => c.id === id) || null;
    }
  }

  async createCampaign(payload: Omit<CampaignData, 'id' | 'recaudado' | 'fechaCreacion' | 'estado' | 'donantesCount' | 'imagenUrl'>): Promise<CampaignData> {
    const imagenUrl = `https://picsum.photos/seed/${Math.random()}/1200/800`;
    
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, imagen_url: imagenUrl }),
      });

      if (!response.ok) throw new Error('Failed to create in API');
      const data = await response.json();
      return this.mapCampaign(data);
    } catch (e) {
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
  }

  async donate(campaignId: string, monto: number, nombre: string = 'Anónimo'): Promise<Donation> {
    try {
      const response = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, monto, nombre }),
      });

      if (!response.ok) throw new Error('Donation failed in API');
      const donation = await response.json();
      return {
        id: donation.id,
        campaignId: donation.campaign_id,
        monto: donation.monto,
        nombreDonante: donation.nombre_donante,
        fecha: donation.fecha
      };
    } catch (e) {
      // Local fallback
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
  }

  async polishStory(story: string): Promise<string> {
    try {
      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story }),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      return data.text || story;
    } catch (e) {
      console.error("Donia AI Error:", e);
      return story;
    }
  }
}
