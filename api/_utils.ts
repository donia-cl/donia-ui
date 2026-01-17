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

// Estilos base para botones en emails
const buttonStyle = "display: inline-block; background-color: #7c3aed; color: white; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 16px; margin-top: 20px;";

// 2. SERVICIO DE CORREO (RESEND)
export class Mailer {
  private static getResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      const errorMsg = '❌ ERROR CRÍTICO: RESEND_API_KEY no está configurada en las variables de entorno de Vercel.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    return new Resend(apiKey);
  }

  // Método auxiliar para enviar y loguear
  private static async send(payload: any) {
    try {
      const resend = this.getResend();
      console.log(`[Mailer] Intentando enviar correo a: ${payload.to} desde: ${payload.from}`);
      
      const { data, error } = await resend.emails.send(payload);

      if (error) {
        console.error('[Resend API Error]:', error);
        throw new Error(`Error de Resend: ${error.message}`);
      }

      console.log('[Resend Success]: Correo enviado con ID:', data?.id);
      return data;
    } catch (e: any) {
      console.error('[Mailer Fatal]:', e.message);
      throw e;
    }
  }

  // 0. Correo de Activación de Cuenta
  static async sendAccountVerification(to: string, userName: string, link: string) {
    return this.send({
      from: 'Donia <seguridad@notifications.donia.cl>',
      to: [to],
      subject: 'Activa tu cuenta en Donia 💜',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
          <div style="border: 1px solid #e2e8f0; border-radius: 32px; padding: 48px; background: white; text-align: center;">
            <h1 style="color: #1e293b; font-size: 28px; margin-bottom: 16px;">¡Hola, ${userName}!</h1>
            <p style="font-size: 16px; color: #64748b; line-height: 1.6;">Gracias por unirte a Donia. Para poder publicar tu campaña y retirar fondos, necesitamos confirmar tu correo electrónico.</p>
            
            <a href="${link}" style="${buttonStyle}">Confirmar mi cuenta</a>

            <p style="margin-top: 32px; font-size: 13px; color: #94a3b8;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="font-size: 11px; color: #cbd5e1; word-break: break-all;">${link}</p>
            
            <p style="margin-top: 40px; font-size: 12px; color: #cbd5e1; border-top: 1px solid #f1f5f9; padding-top: 20px;">Este enlace expirará en 24 horas.</p>
          </div>
        </div>
      `
    });
  }

  // 1. Comprobante para el Donante
  static async sendDonationReceipt(to: string, donorName: string, amount: number, campaignTitle: string, campaignId: string) {
    const campaignUrl = `https://donia.cl/campana/${campaignId}`;
    return this.send({
      from: 'Donia <comprobantes@notifications.donia.cl>',
      to: [to],
      replyTo: 'soporte@donia.cl',
      subject: `¡Gracias por tu apoyo a ${campaignTitle}! 💜`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
          <div style="border: 1px solid #e2e8f0; border-radius: 32px; padding: 48px; background: white; text-align: center;">
            <h1 style="color: #1e293b; font-size: 28px; margin-bottom: 8px;">¡Gracias, ${donorName}!</h1>
            <p style="font-size: 16px; color: #64748b;">Tu donación para <strong>"${campaignTitle}"</strong> ha sido procesada con éxito.</p>
            
            <div style="background: #f8fafc; padding: 32px; border-radius: 24px; margin: 32px 0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Monto del aporte</p>
              <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: 900; color: #1e293b;">$${amount.toLocaleString('es-CL')} CLP</p>
            </div>

            <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">Tu ayuda marca una diferencia real en esta historia.</p>
            
            <a href="${campaignUrl}" style="${buttonStyle}">Ver la campaña</a>
          </div>
        </div>
      `
    });
  }

  // 2. Notificación de Nueva Donación para el DUEÑO
  static async sendOwnerDonationNotification(to: string, ownerName: string, donorName: string, amount: number, campaignTitle: string, comment?: string) {
    return this.send({
      from: 'Donia <alertas@notifications.donia.cl>',
      to: [to],
      subject: `¡Nueva donación recibida para "${campaignTitle}"! 🚀`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
          <div style="border: 1px solid #e2e8f0; border-radius: 32px; padding: 40px; background: white; text-align: center;">
            <h1 style="color: #7c3aed; font-size: 24px; margin-bottom: 16px;">¡Buenas noticias, ${ownerName}!</h1>
            <p style="font-size: 16px; margin-bottom: 24px;">Acabas de recibir una nueva donación de <strong>${donorName}</strong>.</p>
            <div style="background: #f5f3ff; padding: 24px; border-radius: 20px; margin: 24px 0;">
              <p style="margin: 0; font-size: 32px; font-weight: 800; color: #7c3aed;">+$${amount.toLocaleString('es-CL')}</p>
            </div>
            <a href="https://donia.cl/dashboard" style="${buttonStyle}">Ir a mi panel</a>
          </div>
        </div>
      `
    });
  }

  // 3. ¡Meta Alcanzada!
  static async sendGoalReachedNotification(to: string, ownerName: string, campaignTitle: string, totalAmount: number) {
    return this.send({
      from: 'Donia <celebraciones@notifications.donia.cl>',
      to: [to],
      subject: `¡FELICIDADES! 🎉 Meta alcanzada para "${campaignTitle}"`,
      html: `<div style="text-align:center; padding: 40px; font-family: sans-serif;"><h1>¡Lo lograste, ${ownerName}!</h1><p>Tu meta de $${totalAmount.toLocaleString('es-CL')} ha sido alcanzada.</p></div>`
    });
  }

  // 4. Retiro Procesado
  static async sendWithdrawalCompletedNotification(to: string, userName: string, amount: number, campaignTitle: string) {
    return this.send({
      from: 'Donia Finanzas <pagos@notifications.donia.cl>',
      to: [to],
      subject: `¡Pago realizado! Fondos enviados por "${campaignTitle}" 💸`,
      html: `<div style="padding: 40px; font-family: sans-serif;"><h2>¡Transferencia Exitosa!</h2><p>Hola ${userName}, hemos enviado $${amount.toLocaleString('es-CL')} a tu cuenta.</p></div>`
    });
  }

  // 5. Alerta de Seguridad
  static async sendSecurityUpdateNotification(to: string, userName: string, detail: string) {
    return this.send({
      from: 'Donia Seguridad <seguridad@notifications.donia.cl>',
      to: [to],
      subject: `Aviso de seguridad: Cambio en tus datos de cobro 🛡️`,
      html: `<div style="padding: 40px; font-family: sans-serif;"><h2>Aviso de Seguridad</h2><p>Hola ${userName}, se han modificado tus datos de: ${detail}.</p></div>`
    });
  }

  // 6. Confirmación de Solicitud de Retiro
  static async sendWithdrawalConfirmation(to: string, userName: string, amount: number, campaignTitle: string) {
    return this.send({
      from: 'Donia Finanzas <pagos@notifications.donia.cl>',
      to: [to],
      subject: `Recibimos tu solicitud de retiro por $${amount.toLocaleString('es-CL')} 💸`,
      html: `<div style="padding: 40px; font-family: sans-serif;"><h2>Solicitud recibida</h2><p>Hola ${userName}, estamos procesando tu retiro para "${campaignTitle}".</p></div>`
    });
  }

  static async sendProfileUpdateNotification(to: string, userName: string) {
    return this.send({
      from: 'Donia <alertas@notifications.donia.cl>',
      to: [to],
      subject: `Tu perfil de Donia ha sido actualizado`,
      html: `<div style="padding: 40px; font-family: sans-serif;"><p>Hola ${userName}, tus datos han sido actualizados con éxito.</p></div>`
    });
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
    return true; 
  }
}

export const checkRateLimit = (ip: string, limit: number = 10, windowMs: number = 60000) => true;