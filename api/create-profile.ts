import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, fullName } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Usamos upsert con 'onConflict' para que si el trigger de DB ya lo creó, no falle.
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id,
        full_name: fullName || 'Usuario Nuevo',
        role: 'user'
      }, { onConflict: 'id' });

    if (error) {
        // Si sigue fallando por FK, es que auth.users realmente no tiene el ID aún (race condition extrema)
        console.error(`[Profile API] Falló creación para ${id}:`, error.message);
        return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}