
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Usar exactamente los nombres de variables proporcionados por el usuario
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Configuración de base de datos faltante.");
    return res.status(500).json({ success: false, error: 'Database configuration missing' });
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
      const { titulo, historia, monto, categoria, ubicacion, imagen_url } = req.body;
      
      if (!titulo || !monto) {
        return res.status(400).json({ success: false, error: 'Título y monto son requeridos.' });
      }

      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ 
          titulo, 
          historia, 
          monto, 
          categoria, 
          ubicacion, 
          imagen_url,
          recaudado: 0,
          donantes_count: 0,
          estado: 'activa'
        }])
        .select();

      if (error) {
        console.error("Error al insertar:", error.message);
        throw error;
      }
      
      const campaign = data && data.length > 0 ? data[0] : null;
      
      if (!campaign) {
        // Fallback en caso de que RLS impida leer la fila recién creada
        return res.status(201).json({ 
          success: true, 
          data: { id: 'temp-' + Date.now(), titulo, historia, monto, categoria, ubicacion, imagen_url } 
        });
      }

      return res.status(201).json({ success: true, data: campaign });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error("Excepción en API:", error.message);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Unknown database error'
    });
  }
}
