
export interface CampaignData {
  id: string;
  titulo: string;
  historia: string;
  monto: number;
  recaudado: number;
  categoria: string;
  ubicacion: string;
  fechaCreacion: string;
  imagenUrl: string;
  estado: 'activa' | 'finalizada';
  donantesCount: number;
}

export interface Donation {
  id: string;
  campaignId: string;
  monto: number;
  fecha: string;
  nombreDonante: string;
}

export type WizardStep = 'intro' | 'historia' | 'detalles' | 'revisar';
