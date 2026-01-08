
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
        const { data: campaign, error: cError } = await supabase.from('campaigns').select('*').eq('id', id).single();
        if (cError) throw cError;
        const { data: donations } = await supabase.from('donations').select('*').eq('campaign_id', id).order('fecha', { ascending: false }).limit(50);
        return res.status(200).json({ success: true, data: { ...campaign, donations: donations || [] } });
      } else if (userId) {
        const { data, error } = await supabase.from('campaigns').select('*').eq('user_id', userId).order('fecha_creacion', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ success: true, data: data || [] });
      } else {
        const { data, error } = await supabase.from('campaigns').select('*').order('fecha_creacion', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ success: true, data: data || [] });
      }
    }

    if (req.method === 'POST') {
      const { titulo, historia, monto, categoria, ubicacion, imagenUrl, beneficiarioNombre, beneficiarioRelacion, user_id } = req.body;
      const { data, error } = await supabase.from('campaigns').insert([{ 
        titulo, historia, monto: Number(monto), categoria, ubicacion, imagen_url: imagenUrl,
        beneficiario_nombre: beneficiarioNombre, beneficiario_relacion: beneficiarioRelacion,
        user_id, recaudado: 0, donantes_count: 0, estado: 'activa'
      }]).select();
      if (error) throw error;
      return res.status(201).json({ success: true, data: data[0] });
    }

    if (req.method === 'PUT') {
      const { id: bodyId, userId: bodyUserId, updates } = req.body;
      const { data: campaign } = await supabase.from('campaigns').select('user_id').eq('id', bodyId).single();
      if (!campaign || campaign.user_id !== bodyUserId) return res.status(403).json({ error: 'Unauthorized' });
      const { data, error } = await supabase.from('campaigns').update(updates).eq('id', bodyId).select();
      if (error) throw error;
      return res.status(200).json({ success: true, data: data[0] });
    }

    if (req.method === 'DELETE') {
      const { id: queryId, userId: queryUserId } = req.query;
      const { data: campaign } = await supabase.from('campaigns').select('user_id, recaudado').eq('id', queryId).single();
      if (!campaign || campaign.user_id !== queryUserId) return res.status(403).json({ error: 'Unauthorized' });
      if (campaign.recaudado > 0) return res.status(400).json({ error: 'Cannot delete campaign with donations' });
      const { error } = await supabase.from('campaigns').delete().eq('id', queryId);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
