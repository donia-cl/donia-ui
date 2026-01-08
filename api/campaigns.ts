
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
      
      // AUTORREPARACIÓN DE PERFIL
      // 1. Verificar si existe el perfil para evitar error FK (campaigns_owner_id_fkey)
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user_id).single();
      
      if (!profile) {
        // Si no existe, lo creamos usando los datos de Auth y credenciales de admin
        const { data: { user }, error: uError } = await supabase.auth.admin.getUserById(user_id);
        
        const fullName = user?.user_metadata?.full_name || 'Usuario Donia';
        
        // Insertamos el perfil faltante
        const { error: pError } = await supabase.from('profiles').insert([{
             id: user_id,
             full_name: fullName,
             role: 'user',
             is_verified: false
        }]);

        if (pError) {
          console.error("Error creando perfil automático:", pError);
          // Intentamos seguir, pero probablemente fallará el insert de campaña si falló esto
        }
      }

      // 2. Insertamos la campaña usando owner_id
      const { data, error } = await supabase.from('campaigns').insert([{ 
        titulo, historia, monto: Number(monto), categoria, ubicacion, imagen_url: imagenUrl,
        beneficiario_nombre: beneficiarioNombre, beneficiario_relacion: beneficiarioRelacion,
        owner_id: user_id, // FK a profiles.id
        recaudado: 0, donantes_count: 0, estado: 'activa'
      }]).select();
      
      if (error) throw error;
      return res.status(201).json({ success: true, data: data[0] });
    }

    return res.status(405).end();
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
