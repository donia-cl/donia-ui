import { createClient } from '@supabase/supabase-js';

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

    // 2. Sincronización de seguridad: 
    // Si el perfil existe pero dice que no está verificado, checkeamos Auth
    if (profile && !profile.email_verified) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser?.user?.email_confirmed_at) {
        // El usuario ya confirmó pero el trigger falló o no se ejecutó, reparamos ahora
        const { data: updated } = await supabase
          .from('profiles')
          .update({ email_verified: true })
          .eq('id', userId)
          .select()
          .single();
        if (updated) profile = updated;
      }
    }

    if (!profile) {
      return res.status(200).json({ success: false, error: 'Profile not found' });
    }

    return res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}