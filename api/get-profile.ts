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
    // 1. Obtener perfil actual
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    // 2. Sincronización de seguridad (Auto-reparación)
    // Si el perfil no existe o dice que no está verificado, validamos contra Auth directamente
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const isActuallyConfirmed = !!authUser?.user?.email_confirmed_at;

    if (isActuallyConfirmed && (!profile || !profile.email_verified)) {
      logger.info('AUTO_REPAIR_PROFILE_VERIFICATION', { userId });
      
      const { data: updated, error: uError } = await supabase
        .from('profiles')
        .update({ email_verified: true })
        .eq('id', userId)
        .select()
        .single();
        
      if (!uError && updated) profile = updated;
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