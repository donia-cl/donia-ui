
export type CampaignStatus = 'borrador' | 'activa' | 'finalizada' | 'en_revision' | 'pausada';

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
  estado: CampaignStatus;
  donantesCount: number;
  beneficiarioNombre?: string;
  beneficiarioRelacion?: string;
  donations?: Donation[];
  user_id?: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  monto: number;
  fecha: string;
  nombreDonante: string;
  comentario?: string;
}

export interface Withdrawal {
  id: string;
  monto: number;
  fecha: string;
  estado: 'pendiente' | 'completado' | 'rechazado';
  campaignId: string;
  campaignTitle: string;
}

export interface FinancialSummary {
  totalRecaudado: number;
  disponibleRetiro: number;
  enProceso: number;
  totalRetirado: number;
}

export type WizardStep = 'intro' | 'historia' | 'detalles' | 'revisar';
