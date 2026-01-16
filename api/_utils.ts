
import { Resend } from 'resend';

// 1. LOGGER ESTRUCTURADO PARA AUDITORÍA
export const logger = {
  info: (action: string, meta: any = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      action,
      ...meta
    }));
  },
  error: (action: string, error: any, meta: any = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      action,
      error: error.message || error,
      stack: error.stack,
      ...meta
    }));
  },
  audit: (userId: string, action: string, resourceId: string, details: any = {}) => {
    console.log(JSON.stringify({
      level: 'AUDIT',
      timestamp: new Date().toISOString(),
      userId,
      action,
      resourceId,
      ...details
    }));
  }
};

// 2. SERVICIO DE CORREO (RESEND)
export class Mailer {
  private static resend = new Resend(process.env.RESEND_API_KEY);

  static async sendDonationReceipt(to: string, donorName: string, amount: number, campaignTitle: string) {
    if (!process.env.RESEND_API_KEY) {
      logger.error('MAILER_ERROR', new Error('RESEND_API_KEY missing'));
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Donia <comprobantes@donia.cl>',
        to: [to],
        subject: `¡Gracias por tu apoyo a ${campaignTitle}! 💜`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f8fafc; border-radius: 32px;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="background-color: #7c3aed; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <span style="color: white; font-size: 24px;">♥</span>
              </div>
              
              <h1 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.025em;">¡Gracias por tu generosidad, ${donorName}!</h1>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Tu aporte para la campaña <strong>"${campaignTitle}"</strong> ha sido procesado con éxito. Gracias a personas como tú, estamos construyendo una comunidad más solidaria en Chile.
              </p>

              <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
                <p style="color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.1em;">Resumen de donación</p>
                <p style="color: #0f172a; font-size: 32px; font-weight: 900; margin: 0;">$${amount.toLocaleString('es-CL')}</p>
                <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">Medio de pago: Mercado Pago</p>
              </div>

              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                Este correo sirve como comprobante de tu donación voluntaria. Si tienes alguna duda sobre este cargo, puedes contactarnos en soporte@donia.cl.
              </p>

              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;">

              <p style="color: #64748b; font-size: 12px; text-align: center; font-weight: 700;">
                © 2026 Donia SpA. Santiago, Chile.
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        logger.error('MAILER_SEND_FAILED', error);
      } else {
        logger.info('MAILER_SENT_SUCCESS', { to, campaignTitle });
      }
    } catch (e) {
      logger.error('MAILER_CRITICAL_ERROR', e);
    }
  }

  static async sendProfileUpdateNotification(to: string, userName: string) {
    if (!process.env.RESEND_API_KEY) return;

    try {
      await this.resend.emails.send({
        from: 'Donia Seguridad <seguridad@donia.cl>',
        to: [to],
        subject: `Tu perfil en Donia ha sido actualizado 🛡️`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f8fafc; border-radius: 32px;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="background-color: #0f172a; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <span style="color: white; font-size: 20px;">🛡️</span>
              </div>
              
              <h1 style="color: #0f172a; font-size: 22px; font-weight: 900; margin-bottom: 16px;">Hola, ${userName}</h1>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                Te informamos que se han realizado cambios en la información de tu perfil (Nombre, RUT o Teléfono). 
              </p>

              <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 20px; border-radius: 16px; margin-bottom: 24px;">
                <p style="color: #9a3412; font-size: 13px; font-weight: 700; margin: 0;">
                  Si tú no realizaste estos cambios, por favor ponte en contacto con nuestro equipo de soporte inmediatamente escribiendo a soporte@donia.cl para proteger tu cuenta.
                </p>
              </div>

              <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center;">
                Este es un mensaje automático de seguridad. No es necesario que respondas a este correo.
              </p>

              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;">

              <p style="color: #64748b; font-size: 12px; text-align: center; font-weight: 700;">
                © 2026 Donia SpA. Seguridad y Confianza.
              </p>
            </div>
          </div>
        `,
      });
      logger.info('PROFILE_UPDATE_EMAIL_SENT', { to });
    } catch (e) {
      logger.error('PROFILE_UPDATE_EMAIL_ERROR', e);
    }
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
    if (value.length < minLength) throw new Error(`${fieldName} es muy corto (mínimo ${minLength} caracteres).`);
    if (value.includes('<script>')) throw new Error(`${fieldName} contiene caracteres no permitidos.`);
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

// 4. RATE LIMITER (IN-MEMORY)
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

export const checkRateLimit = (ip: string, limit: number = 10, windowMs: number = 60000) => {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  if (record.count > limit) {
    logger.error('RATE_LIMIT_EXCEEDED', { ip, count: record.count });
    throw new Error('Demasiadas solicitudes. Intente nuevamente en unos minutos.');
  }
};
