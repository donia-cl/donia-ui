
import { createClient } from '@supabase/supabase-js';
import { Validator, logger } from './utils';

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
        Validator.uuid(id, 'id');
        const { data: campaign, error: cError } = await supabase.from('campaigns').select('*').eq('id', id).single();
        if (cError) throw cError;
        
        const { data: donations } = await supabase.from('donations').select('*').eq('campaign_id', id).order('created_at', { ascending: false }).limit(50);
        
        return res.status(200).json({ success: true, data: { ...campaign, donations: donations || [] } });
      } else {
        const { data, error } = await supabase.from('campaigns').select('*').order('fecha_creacion', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ success: true, data: data || [] });
      }
    }

    if (req.method === 'POST') {
      const { titulo, historia, monto, categoria, ubicacion, imagenUrl, beneficiarioNombre, beneficiarioRelacion, user_id, duracion } = req.body;
      
      // Validación Estricta
      Validator.required(user_id, 'user_id');
      Validator.string(titulo, 5, 'titulo');
      Validator.string(historia, 20, 'historia');
      Validator.number(monto, 1000, 'monto'); // Mínimo $1000 para crear
      Validator.string(categoria, 3, 'categoria');
      
      // Autorreparación de perfil
      const { data: profile } = await supabase.from('profiles').select('id').eq('id', user_id).single();
      
      if (!profile) {
        const { data: { user } } = await supabase.auth.admin.getUserById(user_id);
        if (user) {
            const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
            await supabase.from('profiles').insert([{
                 id: user_id,
                 full_name: fullName,
                 role: 'user',
                 is_verified: false
            }]);
        }
      }

      const duracionDias = Number(duracion || 60);
      const fechaCreacion = new Date();
      const fechaTermino = new Date(fechaCreacion);
      fechaTermino.setDate(fechaTermino.getDate() + duracionDias);

      const { data, error } = await supabase.from('campaigns').insert([{ 
        titulo, historia, monto: Number(monto), categoria, ubicacion, imagen_url: imagenUrl,
        beneficiario_nombre: beneficiarioNombre, beneficiario_relacion: beneficiarioRelacion,
        owner_id: user_id,
        recaudado: 0, donantes_count: 0, estado: 'activa',
        duracion_dias: duracionDias,
        fecha_termino: fechaTermino.toISOString()
      }]).select();
      
      if (error) throw error;
      
      logger.audit(user_id, 'CREATE_CAMPAIGN', data[0].id, { titulo });
      
      return res.status(201).json({ success: true, data: data[0] });
    }

    return res.status(405).end();
  } catch (error: any) {
    logger.error('CAMPAIGNS_API_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
