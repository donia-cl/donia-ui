
import { CampaignData, Donation } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class CampaignService {
  private static instance: CampaignService;
  private supabase: SupabaseClient | null = null;
  private isLocalMode: boolean = false;

  private constructor() {
    // 1. Acceso Estático a Variables de Entorno (Frontend Safe)
    // Los bundlers (Vite/Webpack/Next) reemplazan estas cadenas por sus valores reales en build-time.
    // No usamos process.env['VAR'] dinámico.
    
    const sUrl = process.env.REACT_APP_SUPABASE_URL || 
                 process.env.NEXT_PUBLIC_SUPABASE_URL;
                 
    const sKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                 process.env.REACT_APP_SUPABASE_ANON_KEY || 
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Diagnóstico seguro en consola
    console.group("Donia System Check");
    console.log("Supabase Connection:", sUrl && sKey ? "✅ Configurada" : "⚠️ Modo Local (Faltan credenciales)");
    console.log("AI Service:", "Delegado a Backend Secure Endpoint (/api/polish)");
    console.groupEnd();

    if (sUrl && sKey) {
      try {
        this.supabase = createClient(sUrl, sKey);
        this.isLocalMode = false;
      } catch (err) {
        console.warn("Donia: Error inicializando Supabase, cambiando a modo local.");
        this.isLocalMode = true;
      }
    } else {
      this.isLocalMode = true;
    }
  }

  public static getInstance(): CampaignService {
    if (!CampaignService.instance) {
      CampaignService.instance = new CampaignService();
    }
    return CampaignService.instance;
  }

  public checkAiAvailability(): boolean {
    // Asumimos que el backend está configurado. 
    // Si la API Key falta en el servidor, el endpoint retornará error, pero la UI debe permitir intentarlo.
    return true; 
  }

  public getConnectionStatus(): 'cloud' | 'local' {
    return this.isLocalMode ? 'local' : 'cloud';
  }

  private getLocalCampaigns(): CampaignData[] {
    const data = localStorage.getItem('donia_campaigns');
    return data ? JSON.parse(data) : [];
  }

  private saveLocalCampaigns(campaigns: CampaignData[]) {
    localStorage.setItem('donia_campaigns', JSON.stringify(campaigns));
  }

  async getCampaigns(): Promise<CampaignData[]> {
    if (this.supabase && !this.isLocalMode) {
      try {
        const { data, error } = await this.supabase
          .from('campaigns')
          .select('*')
          .order('fecha_creacion', { ascending: false });

        if (!error && data) {
          return data.map(c => ({
            id: c.id,
            titulo: c.titulo,
            historia: c.historia,
            monto: Number(c.monto),
            recaudado: Number(c.recaudado),
            categoria: c.categoria,
            ubicacion: c.ubicacion,
            fechaCreacion: c.fecha_creacion,
            imagenUrl: c.imagen_url,
            estado: c.estado,
            donantesCount: c.donantes_count
          }));
        }
      } catch (e) {
        console.error("Donia Fetch Error:", e);
      }
    }
    return this.getLocalCampaigns();
  }

  async getCampaignById(id: string): Promise<CampaignData | null> {
    if (this.supabase && !this.isLocalMode) {
      try {
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
            monto: Number(data.monto),
            recaudado: Number(data.recaudado),
            categoria: data.categoria,
            ubicacion: data.ubicacion,
            fechaCreacion: data.fecha_creacion,
            imagenUrl: data.imagen_url,
            estado: data.estado,
            donantesCount: data.donantes_count
          };
        }
      } catch (e) {
        console.error("Donia Detail Error:", e);
      }
    }
    return this.getLocalCampaigns().find(c => c.id === id) || null;
  }

  async createCampaign(payload: Omit<CampaignData, 'id' | 'recaudado' | 'fechaCreacion' | 'estado' | 'donantesCount' | 'imagenUrl'>): Promise<CampaignData> {
    const imagenUrl = `https://picsum.photos/seed/${Math.random()}/1200/800`;
    
    if (this.supabase && !this.isLocalMode) {
      try {
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
            monto: Number(data.monto),
            recaudado: Number(data.recaudado),
            categoria: data.categoria,
            ubicacion: data.ubicacion,
            fechaCreacion: data.fecha_creacion,
            imagenUrl: data.imagen_url,
            estado: data.estado,
            donantesCount: data.donantes_count
          };
        }
      } catch (e) {
        console.error("Donia Creation Error:", e);
      }
    }

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
      try {
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
      } catch (e) {
        console.error("Donia Donation Error:", e);
      }
    }

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

  async polishStory(story: string): Promise<string> {
    // LLAMADA AL BACKEND SEGURO
    // El frontend ya no tiene la API Key. Se la pide al endpoint /api/polish
    try {
      const response = await fetch('/api/polish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ story }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      return data.text || story;
    } catch (e) {
      console.error("Donia AI Service Error:", e);
      // Fallback: devolvemos la historia original si falla la IA
      return story;
    }
  }
}
