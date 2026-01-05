
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[API/campaigns] Configuración de Supabase faltante.");
    return res.status(500).json({ 
      success: false, 
      error: 'Error de configuración del servidor: Faltan credenciales de base de datos.' 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error("[API/campaigns GET] Error Supabase:", error.message);
        return res.status(500).json({ success: false, error: 'No pudimos obtener las campañas.' });
      }
      return res.status(200).json({ success: true, data: data || [] });
    }

    if (req.method === 'POST') {
      const { titulo, historia, monto, categoria, ubicacion, imagen_url } = req.body;
      
      if (!titulo || !monto) {
        return res.status(400).json({ success: false, error: 'El título y el monto son campos obligatorios.' });
      }

      // Validamos el monto
      const numericMonto = Number(monto);
      if (isNaN(numericMonto) || numericMonto <= 0) {
        return res.status(400).json({ success: false, error: 'El monto debe ser un número válido mayor a cero.' });
      }

      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ 
          titulo, 
          historia, 
          monto: numericMonto, 
          categoria, 
          ubicacion, 
          imagen_url,
          recaudado: 0,
          donantes_count: 0,
          estado: 'activa'
        }])
        .select();

      if (error) {
        console.error("[API/campaigns POST] Error Supabase al insertar:", error.message);
        return res.status(500).json({ 
          success: false, 
          error: `Error al guardar en base de datos: ${error.message}` 
        });
      }
      
      const campaign = data && data.length > 0 ? data[0] : null;
      
      if (!campaign) {
        // Fallback en caso de que RLS impida leer la fila inmediatamente
        console.warn("[API/campaigns POST] La inserción fue exitosa pero no se pudo leer la fila (RLS?). Devolviendo datos manuales.");
        return res.status(201).json({ 
          success: true, 
          data: { id: 'generated-' + Date.now(), titulo, historia, monto: numericMonto, categoria, ubicacion, imagen_url } 
        });
      }

      return res.status(201).json({ success: true, data: campaign });
    }

    return res.status(405).json({ success: false, error: 'Método HTTP no soportado en este endpoint.' });
  } catch (error: any) {
    console.error("[API/campaigns] Excepción crítica:", error.message);
    return res.status(500).json({ 
      success: false,
      error: 'Ocurrió un error inesperado al procesar tu solicitud.'
    });
  }
}
