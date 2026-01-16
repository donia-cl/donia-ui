
import { createClient } from '@supabase/supabase-js';
import { logger, Mailer } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, updates } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Validamos que el ID exista antes de actualizar
    const { data: existing, error: findError } = await supabase.from('profiles').select('id, full_name').eq('id', id).single();
    
    if (findError || !existing) {
       return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // 2. Actualizamos los campos permitidos
    const { data, error } = await supabase.from('profiles').update({
        full_name: updates.full_name,
        rut: updates.rut,
        phone: updates.phone,
    })
    .eq('id', id)
    .select()
    .single();

    if (error) throw error;

    // 3. Obtener el email del usuario desde Auth para enviar la notificación
    // Usamos el cliente admin para acceder a auth.users
    const { data: { user }, error: authError } = await (supabase.auth as any).admin.getUserById(id);
    
    if (!authError && user && user.email) {
      logger.info('TRIGGERING_PROFILE_UPDATE_EMAIL', { email: user.email });
      // Enviamos el correo de notificación (Asíncrono, no bloqueamos la respuesta al cliente)
      Mailer.sendProfileUpdateNotification(user.email, data.full_name || 'Usuario Donia').catch(e => {
        logger.error('ASYNC_MAILER_PROFILE_ERROR', e);
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    logger.error("Update Profile Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
