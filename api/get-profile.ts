import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Configuración CORS consistente con el resto de las APIs
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

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ success: false, error: 'Server configuration missing' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Usamos maybeSingle para que no lance error si no existe

    if (error) throw error;

    if (!data) {
      // Devolvemos 200 con success false para que el front sepa que debe crearlo
      // pero sin disparar una alerta roja de 404 en la consola del navegador.
      return res.status(200).json({ 
        success: false, 
        error: 'Profile not found', 
        data: null 
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("[API/get-profile] Error:", error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}