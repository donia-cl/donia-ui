
import { createClient } from '@supabase/supabase-js';

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
    // Validamos que el ID exista antes de actualizar
    const { data: existing, error: findError } = await supabase.from('profiles').select('id').eq('id', id).single();
    
    if (findError || !existing) {
       return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Actualizamos los campos permitidos
    const { data, error } = await supabase.from('profiles').update({
        full_name: updates.full_name,
        rut: updates.rut,
        phone: updates.phone,
        // is_verified no se actualiza aquí por seguridad, requiere proceso manual
    })
    .eq('id', id)
    .select()
    .single();

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("Update Profile Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
