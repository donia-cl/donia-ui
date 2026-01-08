
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  try {
    const { id, userId } = req.query;

    if (req.method === 'GET') {
      if (id) {
        // Obtenemos una sola campaña
        const { data: campaign, error: cError } = await supabase.from('campaigns').select('*').eq('id', id).single();
        if (cError) throw cError;
        
        // Obtenemos donaciones
        const { data: donations } = await supabase.from('donations').select('*').eq('campaign_id', id).order('created_at', { ascending: false }).limit(50);
        
        return res.status(200).json({ success: true, data: { ...campaign, donations: donations || [] } });
      } else {
        // Listado general (Explorar)
        const { data, error } = await supabase.from('campaigns').select('*').order('fecha_creacion', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ success: true, data: data || [] });
      }
    }

    if (req.method === 'POST') {
      const { titulo, historia, monto, categoria, ubicacion, imagenUrl, beneficiarioNombre, beneficiarioRelacion, user_id } = req.body;
      
      // IMPORTANTE: Insertamos usando owner_id en lugar de user_id
      const { data, error } = await supabase.from('campaigns').insert([{ 
        titulo, historia, monto: Number(monto), categoria, ubicacion, imagen_url: imagenUrl,
        beneficiario_nombre: beneficiarioNombre, beneficiario_relacion: beneficiarioRelacion,
        owner_id: user_id, // Usamos owner_id
        recaudado: 0, donantes_count: 0, estado: 'activa'
      }]).select();
      
      if (error) throw error;
      return res.status(201).json({ success: true, data: data[0] });
    }

    return res.status(405).end();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
