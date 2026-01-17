import { Resend } from 'resend';

// rateLimitMap for in-memory rate limiting
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

/**
 * Basic in-memory rate limiter for serverless functions (effective per-instance).
 * Fix for error in api/polish.ts: Module '"./_utils.js"' has no exported member 'checkRateLimit'.
 */
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
  /**
   * Fix for errors in api/campaigns.ts and api/request-withdrawal.ts regarding missing audit method.
   */
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

const buttonStyle = "display: inline-block; background-color: #7c3aed; color: white; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 16px; margin-top: 20px;";

export class Mailer {
  private static getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no configurada en Vercel.');
    }
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
    return this.send({
      from: 'Donia <seguridad@notifications.donia.cl>',
      to: [to],
      subject: 'Activa tu cuenta en Donia 💜',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 32px; padding: 40px; text-align: center;">
            <h1 style="color: #1e293b;">Hola ${userName},</h1>
            <p>Haz clic abajo para activar tu cuenta y empezar a recaudar fondos:</p>
            <a href="${link}" style="${buttonStyle}">Activar mi cuenta</a>
            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">Si no solicitaste esto, ignora este correo.</p>
          </div>
        </div>
      `
    });
  }

  /**
   * Fix for errors in api/donate.ts, api/preference.ts, api/webhook.ts, api/process-payment.ts.
   */
  static async sendDonationReceipt(to: string, userName: string, amount: number, campaignTitle: string, campaignId: string) {
    return this.send({
      from: 'Donia <pagos@notifications.donia.cl>',
      to: [to],
      subject: '¡Gracias por tu donación! 💜',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7c3aed;">¡Gracias, ${userName}!</h1>
          <p>Tu donación de <strong>$${amount.toLocaleString('es-CL')}</strong> para <strong>"${campaignTitle}"</strong> ha sido procesada con éxito.</p>
          <p>Tu apoyo es fundamental para que esta historia siga adelante.</p>
          <a href="https://donia.cl/campana/${campaignId}" style="${buttonStyle}">Ver campaña</a>
        </div>
      `
    });
  }

  /**
   * Fix for error in api/donate.ts regarding missing sendOwnerDonationNotification method.
   */
  static async sendOwnerDonationNotification(to: string, ownerName: string, donorName: string, amount: number, campaignTitle: string, comment?: string) {
    return this.send({
      from: 'Donia <notificaciones@notifications.donia.cl>',
      to: [to],
      subject: '¡Nueva donación recibida! 🚀',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">¡Buenas noticias, ${ownerName}!</h1>
          <p>Has recibido una nueva donación de <strong>$${amount.toLocaleString('es-CL')}</strong> de parte de <strong>${donorName}</strong> para tu campaña <strong>"${campaignTitle}"</strong>.</p>
          ${comment ? `<p style="font-style: italic; background: #f8fafc; padding: 15px; border-radius: 10px;">"${comment}"</p>` : ''}
          <a href="https://donia.cl/dashboard" style="${buttonStyle}">Ir a mi panel</a>
        </div>
      `
    });
  }

  /**
   * Fix for error in api/donate.ts regarding missing sendGoalReachedNotification method.
   */
  static async sendGoalReachedNotification(to: string, ownerName: string, campaignTitle: string, totalAmount: number) {
    return this.send({
      from: 'Donia <notificaciones@notifications.donia.cl>',
      to: [to],
      subject: '¡Meta alcanzada! 🥳🥳🥳',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7c3aed;">¡Felicidades, ${ownerName}!</h1>
          <p>Tu campaña <strong>"${campaignTitle}"</strong> ha alcanzado su meta de recaudación.</p>
          <p>Has recaudado un total de <strong>$${totalAmount.toLocaleString('es-CL')}</strong>.</p>
          <p>Ahora puedes solicitar el retiro de tus fondos desde tu panel.</p>
          <a href="https://donia.cl/dashboard" style="${buttonStyle}">Ir a mi panel</a>
        </div>
      `
    });
  }

  /**
   * Fix for error in api/update-profile.ts regarding missing sendSecurityUpdateNotification method.
   */
  static async sendSecurityUpdateNotification(to: string, userName: string, field: string) {
    return this.send({
      from: 'Donia <seguridad@notifications.donia.cl>',
      to: [to],
      subject: 'Actualización de seguridad en tu cuenta 🛡️',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">Aviso de seguridad</h1>
          <p>Hola ${userName}, te informamos que se ha modificado información sensible en tu cuenta: <strong>${field}</strong>.</p>
          <p>Si no realizaste este cambio, por favor contáctanos de inmediato.</p>
        </div>
      `
    });
  }

  /**
   * Fix for error in api/update-profile.ts regarding missing sendProfileUpdateNotification method.
   */
  static async sendProfileUpdateNotification(to: string, userName: string) {
    return this.send({
      from: 'Donia <notificaciones@notifications.donia.cl>',
      to: [to],
      subject: 'Perfil actualizado con éxito ✅',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">Perfil actualizado</h1>
          <p>Hola ${userName}, tus datos de perfil han sido actualizados correctamente.</p>
        </div>
      `
    });
  }

  /**
   * Fix for error in api/request-withdrawal.ts regarding missing sendWithdrawalConfirmation method.
   */
  static async sendWithdrawalConfirmation(to: string, userName: string, amount: number, campaignTitle: string) {
    return this.send({
      from: 'Donia <pagos@notifications.donia.cl>',
      to: [to],
      subject: 'Solicitud de retiro recibida 💸',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">Solicitud de retiro</h1>
          <p>Hola ${userName}, hemos recibido tu solicitud para retirar <strong>$${amount.toLocaleString('es-CL')}</strong> de la campaña <strong>"${campaignTitle}"</strong>.</p>
          <p>Nuestro equipo revisará los antecedentes y procesará la transferencia en un plazo de 24 a 48 horas hábiles.</p>
        </div>
      `
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
  /**
   * Fix for errors in api/polish.ts, api/campaigns.ts, and api/contact.ts.
   */
  static string(value: any, minLength: number, fieldName: string) {
    if (typeof value !== 'string') throw new Error(`${fieldName} debe ser texto.`);
    if (value.length < minLength) throw new Error(`${fieldName} es muy corto (mínimo ${minLength} caracteres).`);
  }
  /**
   * Fix for errors in api/campaigns.ts and api/request-withdrawal.ts.
   */
  static number(value: any, min: number, fieldName: string) {
    const num = Number(value);
    if (isNaN(num)) throw new Error(`${fieldName} debe ser un número.`);
    if (num < min) throw new Error(`${fieldName} debe ser mayor o igual a ${min}.`);
  }
  /**
   * Fix for errors in api/campaigns.ts, api/process-payment.ts, and api/request-withdrawal.ts.
   */
  static uuid(value: any, fieldName: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!value || !uuidRegex.test(value)) throw new Error(`${fieldName} ID inválido.`);
  }
}