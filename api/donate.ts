
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { campaignId, monto, nombre, comentario, email, donorUserId } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  // Usamos service_role_key para realizar operaciones críticas de actualización de saldos
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, error: 'Configuración de base de datos incompleta.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // NOTA: Se ha eliminado 'status' del objeto para evitar errores si la columna no existe en la BD.
    // Si la columna 'payment_provider' tampoco existe, podrías necesitar eliminar esa línea también.
    const donationData: any = { 
      campaign_id: campaignId, 
      monto: Number(monto), 
      nombre_donante: nombre || 'Anónimo',
      donor_email: email, // Guardamos el email
      donor_user_id: donorUserId || null, // Linkeamos al usuario si existe
      comentario: comentario || null,
      payment_provider: 'simulated' // Marcamos como simulación/directo
    };

    // 1. Insertar donación
    const { data: donation, error: dError } = await supabase
      .from('donations')
      .insert([donationData])
      .select()
      .single();

    if (dError) throw dError;

    // 2. Actualizar totales usando privilegios de admin (Service Role)
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
