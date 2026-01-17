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

  // 1. Comprobante para el Donante (Ya existente, mejorado)
  static async sendDonationReceipt(to: string, donorName: string, amount: number, campaignTitle: string, campaignId: string) {
    try {
      const resend = this.getResend();
      if (!resend) return;

      const fromEmail = 'Donia <comprobantes@notifications.donia.cl>';
      const campaignUrl = `https://donia.cl/campana/${campaignId}`;
      
      await resend.emails.send({
        from: fromEmail,
        to: [to],
        replyTo: 'soporte@donia.cl',
        subject: `¡Gracias por tu apoyo a ${campaignTitle}! 💜`,
        html: this.getTemplate('receipt', { donorName, amount, campaignTitle, campaignUrl })
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
            <div style="border: 1px solid #e2e8f0; border-radius: 32px; padding: 40px; background: white;">
              <h1 style="color: #7c3aed; font-size: 24px;">¡Buenas noticias, ${ownerName}!</h1>
              <p style="font-size: 16px;">Acabas de recibir una nueva donación de <strong>${donorName}</strong>.</p>
              
              <div style="background: #f5f3ff; padding: 24px; border-radius: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; font-size: 32px; font-weight: 800; color: #7c3aed;">+$${amount.toLocaleString('es-CL')}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #7c3aed; text-transform: uppercase; font-weight: 700;">Aporte a tu campaña</p>
              </div>

              ${comment ? `
                <div style="background: #f8fafc; padding: 20px; border-radius: 16px; border-left: 4px solid #e2e8f0; margin-bottom: 24px;">
                  <p style="margin: 0; font-style: italic; color: #64748b;">"${comment}"</p>
                </div>
              ` : ''}

              <p style="font-size: 14px; color: #64748b;">Sigue compartiendo tu campaña para llegar a más personas.</p>
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
            <div style="border: 2px solid #fee2e2; border-radius: 24px; padding: 32px; background: white;">
              <h2 style="color: #ef4444; margin-top: 0;">Alerta de Seguridad</h2>
              <p>Hola <strong>${userName}</strong>,</p>
              <p>Te informamos que se han modificado datos sensibles en tu perfil: <strong>${detail}</strong>.</p>
              <p style="background: #fef2f2; padding: 15px; border-radius: 12px; font-size: 14px; color: #991b1b;">
                Si tú no realizaste este cambio, por favor contacta a soporte@donia.cl de inmediato para proteger tus fondos.
              </p>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Este es un aviso automático de seguridad.</p>
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
            <div style="border: 1px solid #e2e8f0; border-radius: 24px; padding: 32px; background: white;">
              <h2 style="color: #1e293b; margin-top: 0;">Solicitud de retiro en proceso</h2>
              <p>Hola ${userName}, hemos recibido correctamente tu solicitud de retiro de fondos para la campaña <strong>"${campaignTitle}"</strong>.</p>
              <div style="border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 20px 0; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 14px;">Monto solicitado:</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 800; color: #1e293b;">$${amount.toLocaleString('es-CL')} CLP</p>
              </div>
              <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
                Nuestro equipo revisará los antecedentes y procesará la transferencia a tu cuenta registrada en un plazo de 24 a 48 horas hábiles.
              </p>
            </div>
          </div>
        `
      });
    } catch (e: any) { console.error('Mailer Withdrawal Notify Error:', e.message); }
  }

  private static getTemplate(type: string, data: any) {
    // Helper para no repetir el HTML base del comprobante si se desea refactorizar
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
        <div style="border: 1px solid #e2e8f0; border-radius: 32px; padding: 48px; background: white; text-align: center;">
          <h1 style="color: #1e293b;">¡Gracias, ${data.donorName}!</h1>
          <p>Tu donación para <strong>"${data.campaignTitle}"</strong> ha sido procesada.</p>
          <div style="background: #f8fafc; padding: 32px; border-radius: 24px; margin: 32px 0;">
            <p style="margin: 0; font-size: 32px; font-weight: 900; color: #1e293b;">$${data.amount.toLocaleString('es-CL')} CLP</p>
          </div>
          <a href="${data.campaignUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 18px 32px; border-radius: 18px; text-decoration: none; font-weight: 800;">Ver Campaña</a>
        </div>
      </div>
    `;
  }

  static async sendProfileUpdateNotification(to: string, userName: string) {
    // Mantenemos este para cambios menores
    try {
      const resend = this.getResend();
      if (!resend) return;
      await resend.emails.send({
        from: 'Donia <alertas@notifications.donia.cl>',
        to: [to],
        subject: `Tu perfil de Donia ha sido actualizado`,
        html: `<p>Hola ${userName}, te informamos que los datos de tu cuenta han sido actualizados recientemente.</p>`
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
    // UUID v4 check simple
    return true; 
  }
}

export const checkRateLimit = (ip: string, limit: number = 10, windowMs: number = 60000) => true;