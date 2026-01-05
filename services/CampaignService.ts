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
    if (!c || typeof c !== 'object') throw new Error("Datos de campaña inválidos o nulos.");
    
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

  /**
   * Realiza una petición fetch robusta.
   * Maneja errores 404 y previene la exposición del código fuente.
   */
  private async safeFetch(url: string, options?: RequestInit): Promise<any> {
    try {
      // Intentamos con la URL limpia. Si falla con 404, el catch manejará el respaldo.
      const response = await fetch(url, options);
      
      if (response.status === 404) {
        throw new Error(`Endpoint ${url} no encontrado (404).`);
      }

      const responseText = await response.text();

      // Validación para evitar procesar código fuente como JSON
      if (responseText.includes("import {") || responseText.includes("export default")) {
        throw new Error("El servidor devolvió el código fuente en lugar de ejecutar la función.");
      }

      if (!response.ok) {
        throw new Error(responseText || `Error HTTP ${response.status}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error("La respuesta del servidor no es un JSON válido.");
      }

      if (result.success === false) {
        throw new Error(result.error || "Operación fallida en el servidor.");
      }

      return result;
    } catch (e: any) {
      console.error(`[CampaignService] Fallo en fetch a ${url}:`, e.message);
      throw e; 
    }
  }

  async getCampaigns(): Promise<CampaignData[]> {
    try {
      // Intentamos obtener de la API
      const result = await this.safeFetch('/api/campaigns');
      const campaigns = (result.data || []).map((c: any) => this.mapCampaign(c));
      
      // Guardamos en local para respaldo futuro
      localStorage.setItem('donia_campaigns_cache', JSON.stringify(campaigns));
      return campaigns;
    } catch (e: any) {
      console.warn("API no disponible, intentando cargar desde caché local...");
      const local = localStorage.getItem('donia_campaigns_cache');
      return local ? JSON.parse(local).map((c: any) => this.mapCampaign(c)) : [];
    }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    try {
      const result = await this.safeFetch(`/api/campaign-detail?id=${id}`);
      return this.mapCampaign(result.data);
    } catch (e) {
      // Si falla la API, buscamos en el caché local
      const local = localStorage.getItem('donia_campaigns_cache');
      if (local) {
        const campaigns = JSON.parse(local);
        const found = campaigns.find((c: any) => c.id === id);
        return found ? this.mapCampaign(found) : null;
      }
      return null;
    }
  }

  async createCampaign(payload: Omit<CampaignData, 'id' | 'recaudado' | 'fechaCreacion' | 'estado' | 'donantesCount' | 'imagenUrl'>): Promise<CampaignData> {
    const imagenUrl = `https://picsum.photos/seed/${Date.now()}/1200/800`;
    const result = await this.safeFetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, imagen_url: imagenUrl }),
    });
    return this.mapCampaign(result.data);
  }

  async donate(campaignId: string, monto: number, nombre: string = 'Anónimo', comentario: string = ''): Promise<Donation> {
    const result = await this.safeFetch('/api/donate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, monto, nombre, comentario }),
    });

    const donation = result.data;
    return {
      id: donation.id,
      campaignId: donation.campaign_id,
      monto: Number(donation.monto),
      nombreDonante: donation.nombre_donante || 'Anónimo',
      fecha: donation.fecha,
      comentario: donation.comentario
    };
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