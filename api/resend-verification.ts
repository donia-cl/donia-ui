import { createClient } from '@supabase/supabase-js';
import { Mailer, Validator, logger } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body;
    Validator.email(email);

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) throw new Error('Configuración de servidor incompleta.');

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Intentamos generar enlace de tipo 'signup'
    const redirectTo = `${req.headers.origin || 'https://donia.cl'}/dashboard?verified=true`;
    
    let { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: { redirectTo }
    } as any);

    // Si falla porque ya está registrado, probamos con 'magiclink'
    // El magiclink en Supabase también confirma el email si no lo estaba.
    if (error && (error.message.includes('already been registered') || error.status === 422)) {
      logger.info('USER_ALREADY_EXISTS_USING_MAGICLINK', { email });
      
      const magicRes = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: { redirectTo }
      } as any);
      
      if (magicRes.error) throw magicRes.error;
      data = magicRes.data;
    } else if (error) {
      throw error;
    }

    if (!data || !data.user) {
      throw new Error("No se pudo generar el enlace de verificación.");
    }

    // Obtener nombre para el correo
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.user.id).maybeSingle();
    const userName = profile?.full_name || data.user.user_metadata?.full_name || 'Usuario de Donia';

    // Enviar vía Resend
    await Mailer.sendAccountVerification(email, userName, data.properties.action_link);

    logger.info('MANUAL_VERIFICATION_SENT_SUCCESS', { email, type: data.properties.action_link.includes('type=signup') ? 'signup' : 'magiclink' });

    return res.status(200).json({ 
      success: true, 
      message: "Correo de activación enviado exitosamente." 
    });

  } catch (error: any) {
    logger.error('RESEND_VERIFICATION_FATAL_ERROR', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Error interno al procesar el reenvío." 
    });
  }
}