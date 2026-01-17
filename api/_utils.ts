
import { Resend } from 'resend';

// rateLimitMap for in-memory rate limiting
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
    console.error(`[RATE-LIMIT] Exceeded for IP: ${ip}`);
    throw new Error('Demasiadas solicitudes. Intente nuevamente en unos minutos.');
  }
};

export const logger = {
  info: (action: string, meta: any = {}) => {
    console.log(`[MAIL-INFO] ${action}:`, JSON.stringify(meta));
  },
  error: (action: string, error: any, meta: any = {}) => {
    console.error(`[MAIL-ERROR] ${action}:`, {
      message: error?.message || error,
      details: error?.response?.data || error?.data || error,
      ...meta
    });
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

// --- EMAIL TEMPLATING SYSTEM ---

interface EmailTemplateConfig {
  title: string;
  previewText: string;
  icon: 'security' | 'success' | 'info' | 'heart' | 'money';
  content: string;
  buttonText: string;
  buttonUrl: string;
}

const renderBaseTemplate = (config: EmailTemplateConfig) => {
  const iconMap = {
    security: { emoji: '🛡️', bg: '#fee2e2' }, // red-100
    success: { emoji: '✅', bg: '#d1fae5' },  // emerald-100
    info: { emoji: 'ℹ️', bg: '#e0f2fe' },    // sky-100
    heart: { emoji: '💜', bg: '#f5f3ff' },   // violet-100
    money: { emoji: '💸', bg: '#fef3c7' }    // amber-100
  };

  const { emoji, bg } = iconMap[config.icon];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Logo Header -->
            <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
              <tr>
                <td align="center">
                  <div style="background-color: #7c3aed; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 24px;">💜</span>
                  </div>
                  <div style="margin-top: 8px; color: #0f172a; font-weight: 900; font-size: 20px; letter-spacing: -0.05em;">Donia</div>
                </td>
              </tr>
            </table>

            <!-- Main Card -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <tr>
                <td style="padding: 40px;">
                  <!-- Icon Badge -->
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; background-color: ${bg}; border-radius: 20px; font-size: 32px; text-align: center;">
                      ${emoji}
                    </div>
                  </div>

                  <!-- Title -->
                  <h1 style="margin: 0 0 16px 0; color: #0f172a; font-size: 24px; font-weight: 800; text-align: center; letter-spacing: -0.02em; line-height: 1.2;">
                    ${config.title}
                  </h1>

                  <!-- Content Block -->
                  <div style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
                    ${config.content}
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center;">
                    <a href="${config.buttonUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.2);">
                      ${config.buttonText}
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Simple Footer inside card -->
              <tr>
                <td style="padding: 24px; background-color: #f1f5f9; text-align: center;">
                  <p style="margin: 0; color: #94a3b8; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">
                    © 2026 Donia SpA • Santiago, Chile
                  </p>
                </td>
              </tr>
            </table>

            <!-- Anti-Phishing & Support Footer -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 400px; margin-top: 32px;">
              <tr>
                <td align="center" style="color: #94a3b8; font-size: 12px; line-height: 1.5; font-weight: 500;">
                  Has recibido este correo porque estás registrado en Donia.cl. 
                  Si tienes dudas, contáctanos en 
                  <a href="mailto:soporte@donia.cl" style="color: #7c3aed; text-decoration: none; font-weight: 700;">soporte@donia.cl</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export class Mailer {
  private static getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY no configurada.');
    return new Resend(apiKey);
  }

  private static async send(payload: any) {
    try {
      const resend = this.getResend();
      const { data, error } = await resend.emails.send(payload);
      if (error) {
        logger.error('RESEND_REJECTED', error, { to: payload.to });
        throw new Error(`Resend rechazó el envío: ${error.message}`);
      }
      logger.info('MAIL_SENT_SUCCESS', { id: data?.id, to: payload.to });
      return data;
    } catch (e: any) {
      logger.error('MAILER_FATAL', e);
      throw e;
    }
  }

  static async sendAccountVerification(to: string, userName: string, link: string) {
    const title = 'Activa tu cuenta';
    const content = `Hola <strong>${userName}</strong>,<br><br>Bienvenido a la comunidad de Donia. Para comenzar a crear campañas y recibir apoyo, necesitamos que confirmes tu cuenta haciendo clic en el botón de abajo.`;
    
    return this.send({
      from: 'Donia <seguridad@notifications.donia.cl>',
      to: [to],
      subject: 'Activa tu cuenta en Donia 💜',
      html: renderBaseTemplate({
        title,
        previewText: 'Confirma tu registro en Donia',
        icon: 'heart',
        content,
        buttonText: 'Verificar mi cuenta',
        buttonUrl: link
      })
    });
  }

  static async sendDonationReceipt(to: string, userName: string, amount: number, campaignTitle: string, campaignId: string) {
    const title = '¡Gracias por tu apoyo!';
    const content = `Hola <strong>${userName}</strong>,<br><br>Tu donación de <strong>$${amount.toLocaleString('es-CL')}</strong> para la campaña <strong>"${campaignTitle}"</strong> ha sido procesada con éxito.<br><br>¡Tu aporte marca la diferencia!`;

    return this.send({
      from: 'Donia <pagos@notifications.donia.cl>',
      to: [to],
      subject: '¡Gracias por tu donación! 💜',
      html: renderBaseTemplate({
        title,
        previewText: 'Recibo de donación procesado',
        icon: 'success',
        content,
        buttonText: 'Ver campaña',
        buttonUrl: `https://donia.cl/campana/${campaignId}`
      })
    });
  }

  static async sendOwnerDonationNotification(to: string, ownerName: string, donorName: string, amount: number, campaignTitle: string, comment?: string) {
    const title = '¡Nueva donación recibida!';
    const content = `Hola <strong>${ownerName}</strong>,<br><br><strong>${donorName}</strong> acaba de aportar <strong>$${amount.toLocaleString('es-CL')}</strong> a tu campaña <strong>"${campaignTitle}"</strong>.<br><br>${comment ? `<div style="font-style: italic; background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-top: 16px;">"${comment}"</div>` : ''}`;

    return this.send({
      from: 'Donia <notificaciones@notifications.donia.cl>',
      to: [to],
      subject: '¡Nueva donación recibida! 🚀',
      html: renderBaseTemplate({
        title,
        previewText: `Has recibido $${amount.toLocaleString('es-CL')}`,
        icon: 'success',
        content,
        buttonText: 'Revisar mi panel',
        buttonUrl: 'https://donia.cl/dashboard'
      })
    });
  }

  static async sendGoalReachedNotification(to: string, ownerName: string, campaignTitle: string, totalAmount: number) {
    const title = '¡Felicidades, meta alcanzada!';
    const content = `¡Lo lograste! Tu campaña <strong>"${campaignTitle}"</strong> ha alcanzado su objetivo de recaudación con un total de <strong>$${totalAmount.toLocaleString('es-CL')}</strong>.<br><br>Ya puedes solicitar el retiro de tus fondos desde tu panel.`;

    return this.send({
      from: 'Donia <notificaciones@notifications.donia.cl>',
      to: [to],
      subject: '¡Meta alcanzada! 🥳',
      html: renderBaseTemplate({
        title,
        previewText: 'Tu campaña alcanzó su meta',
        icon: 'heart',
        content,
        buttonText: 'Gestionar retiro',
        buttonUrl: 'https://donia.cl/dashboard'
      })
    });
  }

  static async sendSecurityUpdateNotification(to: string, userName: string, field: string) {
    const title = 'Alerta de Seguridad';
    const content = `Hola <strong>${userName}</strong>,<br><br>Te informamos que se han modificado datos sensibles en tu perfil: <strong>${field}</strong>.<br><br>¿No fuiste tú? Por favor protege tu cuenta de inmediato.`;

    return this.send({
      from: 'Donia <seguridad@notifications.donia.cl>',
      to: [to],
      subject: 'Aviso de seguridad 🛡️',
      html: renderBaseTemplate({
        title,
        previewText: 'Se modificó información en tu cuenta',
        icon: 'security',
        content,
        buttonText: 'Revisar mi seguridad',
        buttonUrl: 'https://donia.cl/dashboard'
      })
    });
  }

  static async sendProfileUpdateNotification(to: string, userName: string) {
    const title = 'Perfil Actualizado';
    const content = `Hola <strong>${userName}</strong>,<br><br>Tus datos de perfil han sido actualizados correctamente en nuestra plataforma.`;

    return this.send({
      from: 'Donia <notificaciones@notifications.donia.cl>',
      to: [to],
      subject: 'Perfil actualizado ✅',
      html: renderBaseTemplate({
        title,
        previewText: 'Tus datos han sido guardados',
        icon: 'info',
        content,
        buttonText: 'Ir a mi perfil',
        buttonUrl: 'https://donia.cl/dashboard'
      })
    });
  }

  static async sendWithdrawalConfirmation(to: string, userName: string, amount: number, campaignTitle: string) {
    const title = 'Solicitud de Retiro Recibida';
    const content = `Hola <strong>${userName}</strong>,<br><br>Hemos recibido tu solicitud para retirar <strong>$${amount.toLocaleString('es-CL')}</strong> de la campaña <strong>"${campaignTitle}"</strong>.<br><br>Nuestro equipo validará los antecedentes y procesará la transferencia en las próximas 48 horas hábiles.`;

    return this.send({
      from: 'Donia <pagos@notifications.donia.cl>',
      to: [to],
      subject: 'Solicitud de retiro en proceso 💸',
      html: renderBaseTemplate({
        title,
        previewText: 'Hemos recibido tu solicitud de retiro',
        icon: 'money',
        content,
        buttonText: 'Ver mis finanzas',
        buttonUrl: 'https://donia.cl/dashboard'
      })
    });
  }
}

export class Validator {
  static email(value: any) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) throw new Error(`Email inválido: ${value}`);
  }
  static required(value: any, name: string) {
    if (value === undefined || value === null || value === '') throw new Error(`${name} es requerido.`);
  }
  static string(value: any, minLength: number, fieldName: string) {
    if (typeof value !== 'string') throw new Error(`${fieldName} debe ser texto.`);
    if (value.length < minLength) throw new Error(`${fieldName} es muy corto (mínimo ${minLength} caracteres).`);
  }
  static number(value: any, min: number, fieldName: string) {
    const num = Number(value);
    if (isNaN(num)) throw new Error(`${fieldName} debe ser un número.`);
    if (num < min) throw new Error(`${fieldName} debe ser mayor o igual a ${min}.`);
  }
  static uuid(value: any, fieldName: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!value || !uuidRegex.test(value)) throw new Error(`${fieldName} ID inválido.`);
  }
}
