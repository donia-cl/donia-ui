
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { campaignId, monto, nombre, comentario } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, error: 'Database configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Insertar donación con el nuevo campo comentario
    const { data: donation, error: dError } = await supabase
      .from('donations')
      .insert([{ 
        campaign_id: campaignId, 
        monto: Number(monto), 
        nombre_donante: nombre || 'Anónimo',
        comentario: comentario || null
      }])
      .select()
      .single();

    if (dError) {
      console.error("[API/donate] Error insertando donación:", dError.message);
      throw dError;
    }

    // Obtener valores actuales de la campaña para actualizar
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('recaudado, donantes_count')
      .eq('id', campaignId)
      .single();

    if (cError) {
      console.error("[API/donate] Error obteniendo campaña:", cError.message);
      throw cError;
    }

    // Actualizar totales en la campaña
    const { error: uError } = await supabase
      .from('campaigns')
      .update({
        recaudado: (campaign.recaudado || 0) + Number(monto),
        donantes_count: (campaign.donantes_count || 0) + 1
      })
      .eq('id', campaignId);

    if (uError) {
      console.error("[API/donate] Error actualizando campaña:", uError.message);
      throw uError;
    }

    return res.status(200).json({ success: true, data: donation });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
