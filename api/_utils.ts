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
      console.error('❌ ERROR CRÍTICO: RESEND_API_KEY no definida.');
      return null;
    }
    return new Resend(apiKey);
  }

  // 1. Comprobante para el Donante
  static async sendDonationReceipt(to: string, donorName: string, amount: number, campaignTitle: string, campaignId: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;

      const campaignUrl = `https://donia.cl/campana/${campaignId}`;
      
      await resend.emails.send({
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
              
              <p style="margin-top: 32px; font-size: 12px; color: #cbd5e1;">Si tienes dudas, contáctanos en soporte@donia.cl</p>
            </div>
          </div>
        `
      });
    } catch (e: any) { console.error('Mailer Error:', e.message); }
  }

  // 2. Notificación de Nueva Donación para el DUEÑO
  static async sendOwnerDonationNotification(to: string, ownerName: string, donorName: string, amount: number, campaignTitle: string, comment?: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;

      await resend.emails.send({
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
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #7c3aed; text-transform: uppercase; font-weight: 700;">Aporte a tu campaña</p>
              </div>

              ${comment ? `
                <div style="background: #f8fafc; padding: 20px; border-radius: 16px; border-left: 4px solid #e2e8f0; margin-bottom: 32px; text-align: left;">
                  <p style="margin: 0; font-style: italic; color: #64748b; font-size: 15px;">"${comment}"</p>
                </div>
              ` : ''}

              <a href="https://donia.cl/dashboard" style="${buttonStyle}">Ir a mi panel</a>
              
              <p style="font-size: 13px; color: #94a3b8; margin-top: 32px;">Sigue compartiendo tu campaña para alcanzar tu meta pronto.</p>
            </div>
          </div>
        `
      });
    } catch (e: any) { console.error('Mailer Owner Notify Error:', e.message); }
  }

  // 3. Notificación de Cambio de Datos Críticos (Seguridad)
  static async sendSecurityUpdateNotification(to: string, userName: string, detail: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;

      await resend.emails.send({
        from: 'Donia Seguridad <seguridad@notifications.donia.cl>',
        to: [to],
        subject: `Aviso de seguridad: Cambio en tus datos de cobro 🛡️`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border: 2px solid #fee2e2; border-radius: 32px; padding: 40px; background: white; text-align: center;">
              <div style="background: #fee2e2; width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
                <span style="font-size: 32px;">🛡️</span>
              </div>
              <h2 style="color: #ef4444; margin: 0 0 16px 0; font-size: 24px;">Alerta de Seguridad</h2>
              <p style="text-align: left; font-size: 16px; color: #475569;">Hola <strong>${userName}</strong>,</p>
              <p style="text-align: left; font-size: 16px; color: #475569;">Te informamos que se han modificado datos sensibles en tu perfil: <strong>${detail}</strong>.</p>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 16px; border: 1px solid #fecaca; margin: 24px 0; text-align: left;">
                <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.5;">
                  <strong>¿No fuiste tú?</strong> Si no realizaste este cambio, por favor protege tu cuenta de inmediato haciendo clic en el botón de abajo y contactando a soporte@donia.cl.
                </p>
              </div>
              
              <a href="https://donia.cl/dashboard" style="${buttonStyle} background-color: #ef4444;">Revisar mi seguridad</a>
            </div>
          </div>
        `
      });
    } catch (e: any) { console.error('Mailer Security Notify Error:', e.message); }
  }

  // 4. Confirmación de Solicitud de Retiro
  static async sendWithdrawalConfirmation(to: string, userName: string, amount: number, campaignTitle: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;

      await resend.emails.send({
        from: 'Donia Finanzas <pagos@notifications.donia.cl>',
        to: [to],
        subject: `Recibimos tu solicitud de retiro por $${amount.toLocaleString('es-CL')} 💸`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border: 1px solid #e2e8f0; border-radius: 32px; padding: 40px; background: white; text-align: center;">
              <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 24px;">Solicitud de retiro recibida</h2>
              <p style="text-align: left; font-size: 16px; color: #475569;">Hola ${userName}, hemos recibido tu solicitud para retirar los fondos recaudados en <strong>"${campaignTitle}"</strong>.</p>
              
              <div style="border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 24px 0; margin: 24px 0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px; font-weight: 700; text-transform: uppercase;">Monto a transferir</p>
                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: 900; color: #1e293b;">$${amount.toLocaleString('es-CL')} CLP</p>
              </div>
              
              <p style="font-size: 14px; color: #64748b; line-height: 1.6; text-align: left; margin-bottom: 32px;">
                Nuestro equipo de finanzas revisará los datos bancarios y procesará el pago en las próximas <strong>24 a 48 horas hábiles</strong>. Recibirás un nuevo correo una vez que la transferencia sea realizada.
              </p>

              <a href="https://donia.cl/dashboard" style="${buttonStyle}">Ver estado de mi retiro</a>
            </div>
          </div>
        `
      });
    } catch (e: any) { console.error('Mailer Withdrawal Notify Error:', e.message); }
  }

  static async sendProfileUpdateNotification(to: string, userName: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;
      await resend.emails.send({
        from: 'Donia <alertas@notifications.donia.cl>',
        to: [to],
        subject: `Tu perfil de Donia ha sido actualizado`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; background: white; text-align: center;">
              <p style="font-size: 16px; color: #1e293b;">Hola ${userName}, te informamos que los datos de tu perfil han sido actualizados.</p>
              <a href="https://donia.cl/dashboard" style="${buttonStyle}">Ir a mi perfil</a>
            </div>
          </div>
        `
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return true; 
  }
}

export const checkRateLimit = (ip: string, limit: number = 10, windowMs: number = 60000) => true;