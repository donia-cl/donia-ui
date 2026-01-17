import { Resend } from 'resend';

// 1. LOGGER ESTRUCTURADO PARA AUDITORÍA
export const logger = {
  info: (action: string, meta: any = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${action}:`, JSON.stringify(meta));
  },
  error: (action: string, error: any, meta: any = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${action}:`, {
      message: error?.message || error,
      details: error?.response?.data || error?.data || error,
      ...meta
    });
  },
  audit: (userId: string, action: string, resourceId: string, details: any = {}) => {
    console.log(`[AUDIT] ${new Date().toISOString()} - User:${userId} Action:${action} Res:${resourceId}`, JSON.stringify(details));
  }
};

// 2. SERVICIO DE CORREO (RESEND)
export class Mailer {
  private static getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: RESEND_API_KEY is NOT defined in environment variables.');
      return null;
    }
    console.log('Resend API Key found (starts with:', apiKey.substring(0, 5), '...)');
    return new Resend(apiKey);
  }

  static async sendDonationReceipt(to: string, donorName: string, amount: number, campaignTitle: string) {
    console.log(`[Mailer] Preparing to send donation receipt to: ${to}`);
    
    try {
      const resend = this.getResend();
      if (!resend) {
        console.error('[Mailer] Aborting email send: No API Key.');
        return;
      }

      // CAMBIO: Usamos @donia.cl en lugar de @notifications.donia.cl por si el subdominio no está verificado
      const fromEmail = 'Donia <comprobantes@donia.cl>';
      
      console.log(`[Mailer] Sending via Resend. From: ${fromEmail}, To: ${to}`);

      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        replyTo: 'soporte@donia.cl',
        subject: `¡Gracias por tu apoyo a ${campaignTitle}! 💜`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
            <div style="border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; background: white;">
              <h1 style="color: #7c3aed;">¡Gracias, ${donorName}!</h1>
              <p>Tu donación de <strong>$${amount.toLocaleString('es-CL')}</strong> para <strong>"${campaignTitle}"</strong> ha sido recibida.</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Monto Donado</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1e293b;">$${amount.toLocaleString('es-CL')} CLP</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">Este es un comprobante de prueba generado por el sistema de Donia.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('[Mailer] Resend API returned an error:', JSON.stringify(error, null, 2));
      } else {
        console.log('[Mailer] Email sent successfully! Resend ID:', data?.id);
      }
    } catch (e: any) {
      console.error('[Mailer] Unexpected exception during email send:', e.message);
    }
  }

  static async sendProfileUpdateNotification(to: string, userName: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;
      await resend.emails.send({
        from: 'Donia Seguridad <seguridad@donia.cl>',
        to: [to],
        subject: `Alerta de seguridad: Perfil actualizado 🛡️`,
        html: `<p>Hola ${userName}, los datos de tu perfil han sido actualizados.</p>`
      });
    } catch (e) { console.error(e); }
  }
}

// 3. VALIDADOR DE INPUTS
export class Validator {
  static required(value: any, fieldName: string) {
    if (value === undefined || value === null || value === '') {
      throw new Error(`Campo requerido faltante: ${fieldName}`);
    }
  }

  static string(value: any, minLength: number, fieldName: string) {
    if (typeof value !== 'string') throw new Error(`${fieldName} debe ser texto.`);
    if (value.length < minLength) throw new Error(`${fieldName} es muy corto.`);
  }

  static number(value: any, min: number, fieldName: string) {
    const num = Number(value);
    if (isNaN(num)) throw new Error(`${fieldName} debe ser un número.`);
    if (num < min) throw new Error(`${fieldName} debe ser mayor o igual a ${min}.`);
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

export const checkRateLimit = (ip: string, limit: number = 10, windowMs: number = 60000) => {
  return true;
};