import { createClient } from '@supabase/supabase-js';
import { logger } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.query;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  try {
    // 1. Obtener perfil actual de la tabla
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    // 2. Consultar el estado REAL en Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      logger.error('AUTH_FETCH_ERROR', authError);
    }

    // Verificación estricta: debe existir la fecha de confirmación
    const confirmedAt = authUser?.user?.email_confirmed_at;
    const isActuallyConfirmed = !!confirmedAt;

    // LOG DE DIAGNÓSTICO: Esto aparecerá en tus logs de Vercel/Servidor
    console.log(`[DEBUG] User: ${userId} | AuthConfirmedAt: ${confirmedAt || 'NULL'} | TableVerified: ${profile?.email_verified}`);

    // 3. Sincronización (Auto-reparación)
    if (isActuallyConfirmed && (!profile || !profile.email_verified)) {
      logger.info('SYNC_VERIFICATION_TO_TABLE', { userId, confirmedAt });
      
      const { data: updated, error: uError } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', userId)
        .select()
        .single();
        
      if (!uError && updated) profile = updated;
    } else if (!isActuallyConfirmed && profile?.email_verified) {
      // Caso inverso: Si la tabla dice TRUE pero Auth dice NULL (error de integridad), corregimos a FALSE
      logger.info('REVERT_VERIFICATION_TO_FALSE', { userId });
      const { data: updated } = await supabase
        .from('profiles')
        .update({ email_verified: false })
        .eq('id', userId)
        .select()
        .single();
      if (updated) profile = updated;
    }

    if (!profile) {
      return res.status(200).json({ success: false, error: 'Profile not found' });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    logger.error('GET_PROFILE_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}