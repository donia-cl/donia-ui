
export type CampaignStatus = 'borrador' | 'activa' | 'finalizada' | 'en_revision' | 'pausada';

export interface Profile {
  id: string;
  full_name: string;
  rut?: string;
  phone?: string;
  role: 'user' | 'admin' | 'reviewer';
  is_verified: boolean;
}

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
  owner_id?: string; // Cambiado de user_id a owner_id
}

export interface Donation {
  id: string;
  campaignId: string;
  monto: number;
  fecha: string;
  nombreDonante: string;
  emailDonante: string; // Nuevo campo obligatorio
  comentario?: string;
  donorUserId?: string; // Opcional, solo si está logueado
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
