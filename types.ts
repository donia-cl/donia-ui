export type CampaignStatus = 'borrador' | 'activa' | 'finalizada' | 'en_revision' | 'pausada';

export interface Profile {
  id: string;
  full_name: string;
  rut?: string;
  phone?: string;
  role: 'user' | 'admin' | 'reviewer';
  is_verified: boolean; // Verificación de identidad (KYC)
  email_verified: boolean; // Verificación de cuenta/email
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
  fechaTermino?: string;
  duracionDias?: number;
  imagenUrl: string;
  estado: CampaignStatus;
  donantesCount: number;
  beneficiarioNombre?: string;
  beneficiarioRelacion?: string;
  donations?: Donation[];
  owner_id?: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  monto: number;
  fecha: string;
  nombreDonante: string;
  emailDonante: string;
  comentario?: string;
  donorUserId?: string;
  status?: 'completed' | 'refunded' | 'pending';
  paymentId?: string;
  campaign?: {
    titulo: string;
    imagenUrl: string;
  };
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