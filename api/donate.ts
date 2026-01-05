
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
    return res.status(500).json({ success: false, error: 'Configuración de base de datos no encontrada.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const donationData: any = { 
      campaign_id: campaignId, 
      monto: Number(monto), 
      nombre_donante: nombre || 'Anónimo',
      comentario: comentario || null
    };

    // Intentamos la inserción (asumiendo que la columna existe tras el ALTER TABLE)
    const { data: donation, error: dError } = await supabase
      .from('donations')
      .insert([donationData])
      .select()
      .single();

    if (dError) {
        if (dError.message.includes('comentario')) {
            throw new Error("La columna 'comentario' no existe en la tabla 'donations'. Por favor, ejecuta el script SQL de configuración proporcionado.");
        }
        throw dError;
    }

    // Actualizar los totales de la campaña
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('recaudado, donantes_count')
      .eq('id', campaignId)
      .single();

    if (!cError && campaign) {
      await supabase
        .from('campaigns')
        .update({
          recaudado: (Number(campaign.recaudado) || 0) + Number(monto),
          donantes_count: (Number(campaign.donantes_count) || 0) + 1
        })
        .eq('id', campaignId);
    }

    return res.status(200).json({ success: true, data: donation });
  } catch (error: any) {
    console.error("[API/donate] Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
