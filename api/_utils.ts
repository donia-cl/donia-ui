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
      message: error?.message || error,
      details: error?.response?.data || error?.data || error,
      stack: error?.stack,
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
  private static getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      logger.error('MAILER_CONFIG_MISSING', 'La variable RESEND_API_KEY no está definida en el entorno.');
      return null;
    }
    return new Resend(apiKey);
  }

  /**
   * Envía comprobante de donación
   * Nota: El dominio 'notifications.donia.cl' DEBE estar verificado en Resend.
   */
  static async sendDonationReceipt(to: string, donorName: string, amount: number, campaignTitle: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;

      const { data, error } = await resend.emails.send({
        from: 'Donia <comprobantes@notifications.donia.cl>',
        to: [to],
        replyTo: 'soporte@donia.cl',
        subject: `¡Gracias por tu apoyo a ${campaignTitle}! 💜`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 32px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
              <div style="background-color: #7c3aed; width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 32px;">
                <span style="color: white; font-size: 28px; line-height: 56px; display: block; text-align: center; width: 100%;">♥</span>
              </div>
              
              <h1 style="color: #0f172a; font-size: 26px; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.04em;">¡Gracias por tu generosidad, ${donorName}!</h1>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                Tu aporte para la campaña <strong>"${campaignTitle}"</strong> ha sido recibido. Tu ayuda es fundamental para que esta historia tenga un final feliz.
              </p>

              <div style="background-color: #f8fafc; padding: 32px; border-radius: 24px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
                <p style="color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.15em;">Detalle de tu donación</p>
                <p style="color: #0f172a; font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -0.02em;">$${amount.toLocaleString('es-CL')}</p>
                <p style="color: #94a3b8; font-size: 13px; margin: 12px 0 0 0; font-weight: 600;">Procesado vía Mercado Pago</p>
              </div>

              <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; font-weight: 500;">
                Este correo es un comprobante oficial de tu donación. Si tienes dudas, escríbenos a soporte@donia.cl mencionando el correo asociado a tu aporte.
              </p>

              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="color: #64748b; font-size: 12px; font-weight: 700;">
                  © 2026 Donia SpA. Santiago, Chile.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        logger.error('RESEND_API_ERROR_RECEIPT', error, { to, campaignTitle });
      } else {
        logger.info('MAILER_SENT_SUCCESS', { to, campaignTitle, emailId: data?.id });
      }
    } catch (e) {
      logger.error('MAILER_CRITICAL_ERROR', e);
    }
  }

  /**
   * Envía alerta de seguridad por cambio de perfil
   */
  static async sendProfileUpdateNotification(to: string, userName: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;

      const { data, error } = await resend.emails.send({
        from: 'Donia Seguridad <seguridad@notifications.donia.cl>',
        to: [to],
        replyTo: 'soporte@donia.cl',
        subject: `Actualización de seguridad en tu cuenta 🛡️`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 32px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
              <div style="background-color: #0f172a; width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin-bottom: 32px;">
                <span style="color: white; font-size: 24px; line-height: 56px; display: block; text-align: center; width: 100%;">🛡️</span>
              </div>
              
              <h1 style="color: #0f172a; font-size: 24px; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.04em;">Hola, ${userName}</h1>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                Te notificamos que la información de tu cuenta (Nombre, RUT o Teléfono) ha sido modificada recientemente.
              </p>

              <div style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 24px; border-radius: 20px; margin-bottom: 32px;">
                <p style="color: #9a3412; font-size: 14px; font-weight: 700; margin: 0; line-height: 1.5;">
                  Si NO realizaste estos cambios, contacta a nuestro equipo de soporte de inmediato escribiendo a soporte@donia.cl para bloquear cualquier acceso no autorizado.
                </p>
              </div>

              <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; text-align: center; font-weight: 500;">
                Este es un aviso automático de seguridad. Donia nunca te pedirá claves o códigos por este medio.
              </p>

              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="color: #64748b; font-size: 11px; font-weight: 700;">
                  © 2026 Donia SpA. Centro de Seguridad.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        logger.error('RESEND_API_ERROR_PROFILE', error, { to });
      } else {
        logger.info('PROFILE_UPDATE_EMAIL_SENT', { to, emailId: data?.id });
      }
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
