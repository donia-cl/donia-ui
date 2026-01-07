
import { createClient } from '@supabase/supabase-js';

/**
 * NOTA PARA EL DESARROLLADOR:
 * Si recibes el error "column user_id does not exist", ejecuta esto en Supabase SQL Editor:
 * ALTER TABLE campaigns ADD COLUMN user_id UUID REFERENCES auth.users(id);
 */

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
      const { 
        titulo, 
        historia, 
        monto, 
        categoria, 
        ubicacion, 
        imagenUrl, 
        beneficiarioNombre, 
        beneficiarioRelacion, 
        user_id 
      } = req.body;

      if (!user_id) {
        return res.status(400).json({ success: false, error: 'El ID de usuario es obligatorio para crear una campaña.' });
      }
      
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
          user_id, 
          recaudado: 0,
          donantes_count: 0,
          estado: 'activa'
        }])
        .select();

      if (error) {
        // Manejo específico para error de columna faltante
        if (error.code === '42703') {
          throw new Error("Error de Base de Datos: Falta la columna 'user_id' en la tabla 'campaigns'. Por favor, añádela en Supabase.");
        }
        throw error;
      }
      
      return res.status(201).json({ success: true, data: data[0] });
    }
  } catch (error: any) {
    console.error("[API/campaigns] Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
