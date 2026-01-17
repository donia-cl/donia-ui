
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
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    // 1. Buscar al usuario por email
    // Usamos admin para saltar RLS
    // Fix: Avoid unsafe destructuring that causes 'never' type inference on users
    const { data, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !data?.users) {
      throw new Error("Usuario no encontrado.");
    }

    // Explicitly find the user from the fetched list
    // Cast data.users to any[] to avoid 'never' type inference issue in some environments
    const user = (data.users as any[]).find(u => u.email === email);

    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    // 2. Generar token propio en nuestra tabla
    const { data: verification, error: vError } = await supabase
      .from('email_verifications')
      .insert([{ user_id: user.id }])
      .select()
      .single();

    if (vError) throw vError;

    // 3. Construir link de verificación propio
    const baseUrl = req.headers.origin || 'https://donia.cl';
    const verifyLink = `${baseUrl}/api/verify-token?token=${verification.token}`;

    // 4. Obtener nombre para el correo
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
    const name = profile?.full_name || 'Usuario';

    // 5. Enviar via Resend
    await Mailer.sendAccountVerification(email, name, verifyLink);

    console.log(`[Verification] Token generado para ${email}: ${verification.token}`);

    return res.status(200).json({ success: true });

  } catch (error: any) {
    logger.error('RESEND_VERIFICATION_HANDLER_FAIL', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
