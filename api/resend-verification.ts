
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

    // 1. Generar enlace de verificación (Signup) mediante el Admin API de Supabase
    // Este enlace es el que Supabase procesa para marcar el email como verificado
    const redirectTo = `${req.headers.origin || 'https://donia.cl'}/dashboard?verified=true`;
    
    // Fixed: Cast the configuration object to any to bypass the TypeScript error.
    // In this 'resend' flow for an existing user, the password is not required by 
    // the backend API, even though it's marked as required in the GenerateSignupLinkParams type.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: { redirectTo }
    } as any);

    if (error) throw error;

    // 2. Obtener nombre del usuario si existe en perfiles
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.user.id).maybeSingle();
    const userName = profile?.full_name || data.user.user_metadata?.full_name || 'Usuario de Donia';

    // 3. Enviar el correo usando nuestra integración PROPIA de Resend
    await Mailer.sendAccountVerification(email, userName, data.properties.action_link);

    logger.info('MANUAL_VERIFICATION_SENT', { email });

    return res.status(200).json({ success: true, message: "Correo de activación enviado exitosamente vía Resend." });

  } catch (error: any) {
    logger.error('RESEND_VERIFICATION_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
