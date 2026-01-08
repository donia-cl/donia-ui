
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Configuración CORS
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
    // 1. Verificar si ya existe para no duplicar
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', id).maybeSingle();
    
    if (!existing) {
        // 2. Insertar perfil con privilegios de admin (Service Role)
        const { error } = await supabase.from('profiles').insert([{
            id,
            full_name: fullName || 'Usuario Nuevo',
            role: 'user',
            is_verified: false
        }]);

        if (error) {
            console.error("Error creating profile row:", error);
            throw error;
        }
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Profile API Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
