import { createClient } from '@supabase/supabase-js';
import { logger, Mailer } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, updates } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  try {
    const { data: existing, error: findError } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (findError || !existing) return res.status(404).json({ error: 'Perfil no encontrado' });

    // Detectar si cambian datos sensibles
    const isSensitiveChange = (updates.rut && updates.rut !== existing.rut) || (updates.phone && updates.phone !== existing.phone);

    const { data, error } = await supabase.from('profiles').update({
        full_name: updates.full_name,
        rut: updates.rut,
        phone: updates.phone,
    }).eq('id', id).select().single();

    if (error) throw error;

    const { data: authData } = await (supabase.auth as any).admin.getUserById(id);
    const email = authData?.user?.email;

    if (email) {
      if (isSensitiveChange) {
        // Alerta de seguridad crítica
        await Mailer.sendSecurityUpdateNotification(email, data.full_name, 'RUT o Teléfono de contacto');
      } else {
        // Notificación estándar
        await Mailer.sendProfileUpdateNotification(email, data.full_name);
      }
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    logger.error("Update Profile Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}