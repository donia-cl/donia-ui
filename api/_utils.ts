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
      console.error('❌ ERROR CRÍTICO: RESEND_API_KEY no está definida en las variables de entorno de Vercel.');
      return null;
    }
    // Log para confirmar que la key se está leyendo (solo los primeros caracteres por seguridad)
    console.log(`✅ API Key detectada: ${apiKey.substring(0, 6)}...`);
    return new Resend(apiKey);
  }

  static async sendDonationReceipt(to: string, donorName: string, amount: number, campaignTitle: string) {
    console.log(`[Mailer] Iniciando proceso para: ${to}`);
    
    try {
      const resend = this.getResend();
      if (!resend) return;

      // USAR EL SUBDOMINIO VERIFICADO EN TU CAPTURA DE PANTALLA
      const fromEmail = 'Donia <comprobantes@notifications.donia.cl>';
      
      console.log(`[Mailer] Intentando enviar vía Resend desde: ${fromEmail}`);

      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        replyTo: 'soporte@donia.cl',
        subject: `¡Gracias por tu apoyo a ${campaignTitle}! 💜`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
            <div style="border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; background: white;">
              <h1 style="color: #7c3aed;">¡Gracias, ${donorName}!</h1>
              <p>Tu donación de <strong>$${amount.toLocaleString('es-CL')}</strong> para <strong>"${campaignTitle}"</strong> ha sido procesada.</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Monto Donado</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1e293b;">$${amount.toLocaleString('es-CL')} CLP</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">Comprobante de prueba generado por Donia.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Error devuelto por la API de Resend:', JSON.stringify(error, null, 2));
      } else {
        console.log('🚀 Correo enviado con éxito. ID de Resend:', data?.id);
      }
    } catch (e: any) {
      console.error('❌ Excepción inesperada en Mailer:', e.message);
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