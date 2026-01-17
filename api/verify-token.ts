import { createClient } from '@supabase/supabase-js';
import { logger } from './_utils.js';

export default async function handler(req: any, res: any) {
  const { token } = req.query;

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  const baseUrl = req.headers.origin || 'https://donia.cl';

  try {
    if (!token) throw new Error("Token no proporcionado.");

    // 1. Buscar el token
    const { data: verification, error: vError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('token', token)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (vError || !verification) {
      throw new Error("El enlace es inválido o ha expirado.");
    }

    // 2. Marcar como verificado en profiles y consumir token
    const { error: pError } = await supabase
      .from('profiles')
      .update({ email_verified: true })
      .eq('id', verification.user_id);

    if (pError) throw pError;

    await supabase
      .from('email_verifications')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', verification.id);

    // 3. Redirigir al dashboard con éxito
    return res.redirect(303, `${baseUrl}/dashboard?verified=true`);

  } catch (error: any) {
    logger.error('VERIFY_TOKEN_ERROR', error);
    return res.redirect(303, `${baseUrl}/dashboard?error=${encodeURIComponent(error.message)}`);
  }
}