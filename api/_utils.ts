import { Resend } from 'resend';

// 1. LOGGER ESTRUCTURADO PARA AUDITORÍA
export const logger = {
  info: (action: string, meta: any = {}) => {
    console.log(`[INFO] ${action}:`, JSON.stringify(meta));
  },
  error: (action: string, error: any, meta: any = {}) => {
    console.error(`[ERROR] ${action}:`, {
      message: error?.message || error,
      details: error?.response?.data || error?.data || error,
      ...meta
    });
  },
  audit: (userId: string, action: string, resourceId: string, details: any = {}) => {
    console.log(`[AUDIT] Action:${action} Res:${resourceId}`, JSON.stringify(details));
  }
};

// 2. SERVICIO DE CORREO (RESEND)
export class Mailer {
  private static getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ ERROR CRÍTICO: RESEND_API_KEY no definida.');
      return null;
    }
    return new Resend(apiKey);
  }

  static async sendDonationReceipt(to: string, donorName: string, amount: number, campaignTitle: string, campaignId: string) {
    console.log(`[Mailer] Preparando correo para: ${to} (Campaña: ${campaignId})`);
    
    try {
      const resend = this.getResend();
      if (!resend) return;

      const fromEmail = 'Donia <comprobantes@notifications.donia.cl>';
      const campaignUrl = `https://donia.cl/campana/${campaignId}`;
      
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        replyTo: 'soporte@donia.cl',
        subject: `¡Gracias por tu apoyo a ${campaignTitle}! 💜`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
            <div style="border: 1px solid #e2e8f0; border-radius: 32px; padding: 48px; background: white; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
              <div style="display: inline-block; background: #f5f3ff; padding: 16px; border-radius: 20px; margin-bottom: 24px;">
                <img src="https://donia.cl/favicon.ico" alt="Donia" style="width: 32px; height: 32px;">
              </div>
              
              <h1 style="color: #1e293b; font-size: 28px; font-weight: 800; margin-bottom: 16px; letter-spacing: -0.025em;">¡Gracias, ${donorName}!</h1>
              <p style="font-size: 16px; line-height: 24px; color: #64748b; margin-bottom: 32px;">
                Tu generosidad está haciendo la diferencia. Hemos recibido tu donación para la campaña <strong style="color: #7c3aed;">"${campaignTitle}"</strong>.
              </p>
              
              <div style="background: #f8fafc; padding: 32px; border-radius: 24px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
                <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 8px;">Monto de la Donación</p>
                <p style="margin: 0; font-size: 32px; font-weight: 900; color: #1e293b;">$${amount.toLocaleString('es-CL')} <span style="font-size: 16px; color: #94a3b8; font-weight: 600;">CLP</span></p>
              </div>

              <a href="${campaignUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 18px 32px; border-radius: 18px; text-decoration: none; font-weight: 800; font-size: 16px; transition: background 0.2s;">
                Ver la campaña en Donia
              </a>

              <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; line-height: 18px;">
                Este correo confirma que tu aporte ha sido procesado exitosamente.<br>
                Si tienes dudas, escríbenos a <a href="mailto:soporte@donia.cl" style="color: #7c3aed; text-decoration: none; font-weight: 600;">soporte@donia.cl</a>
              </p>
            </div>
            
            <p style="text-align: center; margin-top: 24px; font-size: 11px; color: #cbd5e1; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">
              © 2026 Donia SpA · Santiago, Chile
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Error Resend:', JSON.stringify(error, null, 2));
      } else {
        console.log('🚀 Correo con link enviado. ID:', data?.id);
      }
    } catch (e: any) {
      console.error('❌ Excepción Mailer:', e.message);
    }
  }

  static async sendProfileUpdateNotification(to: string, userName: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;
      await resend.emails.send({
        from: 'Donia Seguridad <seguridad@notifications.donia.cl>',
        to: [to],
        subject: `Alerta de seguridad: Perfil actualizado 🛡️`,
        html: `<p>Hola ${userName}, los datos de tu perfil han sido actualizados.</p>`
      });
    } catch (e) { console.error(e); }
  }
}

export class Validator {
  static required(value: any, fieldName: string) {
    if (value === undefined || value === null || value === '') {
      throw new Error(`Campo requerido faltante: ${fieldName}`);
    }
  }
  static string(value: any, minLength: number, fieldName: string) {
    if (typeof value !== 'string' || value.length < minLength) throw new Error(`${fieldName} inválido.`);
  }
  static number(value: any, min: number, fieldName: string) {
    const num = Number(value);
    if (isNaN(num) || num < min) throw new Error(`${fieldName} debe ser >= ${min}.`);
  }
  static email(value: any) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) throw new Error(`Email inválido: ${value}`);
  }
  static uuid(value: any, fieldName: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!value || !uuidRegex.test(value)) throw new Error(`${fieldName} ID inválido.`);
  }
}

export const checkRateLimit = (ip: string, limit: number = 10, windowMs: number = 60000) => true;