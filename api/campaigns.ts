
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, error: 'Database configuration missing.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (req.method === 'POST') {
      const { titulo, historia, monto, categoria, ubicacion, imagenUrl, beneficiarioNombre, beneficiarioRelacion, user_id } = req.body;
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ 
          titulo, 
          historia, 
          monto: Number(monto), 
          categoria, 
          ubicacion, 
          imagen_url: imagenUrl,
          beneficiario_nombre: beneficiarioNombre,
          beneficiario_relacion: beneficiarioRelacion,
          user_id: user_id, // Guardamos quien la creó
          recaudado: 0,
          donantes_count: 0,
          estado: 'activa'
        }])
        .select();

      if (error) throw error;
      return res.status(201).json({ success: true, data: data[0] });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
