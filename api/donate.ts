
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { campaignId, monto, nombre } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Registrar donación
    const { data: donation, error: dError } = await supabase
      .from('donations')
      .insert([{ campaign_id: campaignId, monto, nombre_donante: nombre }])
      .select()
      .single();

    if (dError) throw dError;

    // 2. Obtener valores actuales para actualizar
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('recaudado, donantes_count')
      .eq('id', campaignId)
      .single();

    if (cError) throw cError;

    // 3. Actualizar campaña
    const { error: uError } = await supabase
      .from('campaigns')
      .update({
        recaudado: (campaign.recaudado || 0) + monto,
        donantes_count: (campaign.donantes_count || 0) + 1
      })
      .eq('id', campaignId);

    if (uError) throw uError;

    return res.status(200).json(donation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
