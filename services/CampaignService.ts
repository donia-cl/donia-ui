
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
   * Evita el error 'body stream already read' y valida que la respuesta sea JSON.
   */
  private async safeFetch(url: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(url, options);
      
      // Obtenemos el texto de la respuesta una única vez para todas las validaciones
      const responseText = await response.text();

      // Validación de tipo de contenido
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Si no es JSON, probablemente es el código fuente (.ts) o una página de error HTML
        console.warn(`[CampaignService] Respuesta no-JSON detectada en ${url}. Content-Type: ${contentType}`);
        
        // Si el servidor devolvió el código fuente de la función (común en entornos mal configurados)
        if (responseText.includes("import {") || responseText.includes("export default")) {
          throw new Error("El servidor devolvió el código fuente en lugar de ejecutar la función. Revisa la configuración de las rutas API.");
        }
        
        // Si es un 404 común
        if (response.status === 404) {
          throw new Error(`Endpoint no encontrado (404): ${url}`);
        }

        throw new Error("La respuesta del servidor no tiene el formato esperado (JSON).");
      }

      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = responseText.substring(0, 100) || response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("[CampaignService] Error crítico al parsear JSON:", responseText.substring(0, 100));
        throw new Error("Error interno al procesar los datos recibidos del servidor.");
      }

      if (result.success === false) {
        throw new Error(result.error || "Operación rechazada por el servidor.");
      }

      return result;
    } catch (e: any) {
      console.error(`[CampaignService] Fallo en fetch a ${url}:`, e.message);
      throw e; 
    }
  }

  async getCampaigns(): Promise<CampaignData[]> {
    try {
      const result = await this.safeFetch('/api/campaigns');
      return (result.data || []).map((c: any) => this.mapCampaign(c));
    } catch (e: any) {
      console.warn("Cargando datos locales de respaldo...");
      const local = localStorage.getItem('donia_campaigns');
      return local ? JSON.parse(local).map((c: any) => this.mapCampaign(c)) : [];
    }
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    try {
      const result = await this.safeFetch(`/api/campaign-detail?id=${id}`);
      return this.mapCampaign(result.data);
    } catch (e) {
      console.error("[CampaignService] No se pudo recuperar la campaña:", id);
      return null;
    }
  }

  async createCampaign(payload: Omit<CampaignData, 'id' | 'recaudado' | 'fechaCreacion' | 'estado' | 'donantesCount' | 'imagenUrl'>): Promise<CampaignData> {
    const imagenUrl = `https://picsum.photos/seed/${Math.random()}/1200/800`;
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
    if (!donation) throw new Error("Confirmación de donación no recibida.");

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
