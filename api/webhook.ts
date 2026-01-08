
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Solo procesamos pagos
  if (type !== 'payment') return res.status(200).end();

  try {
    // 1. Obtener detalles del pago desde Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const payment = await mpResponse.json();

    if (payment.status === 'approved') {
      const { campaign_id, donor_name, donor_comment } = payment.metadata;
      const amount = payment.transaction_amount;

      if (!supabaseUrl || !serviceRoleKey) throw new Error("Configuración DB ausente");
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // 2. Registrar la donación
      const { error: dError } = await supabase
        .from('donations')
        .insert([{
          campaign_id: campaign_id,
          monto: amount,
          nombre_donante: donor_name,
          comentario: donor_comment
        }]);

      if (dError) throw dError;

      // 3. Actualizar totales de la campaña
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('recaudado, donantes_count')
        .eq('id', campaign_id)
        .single();

      if (campaign) {
        await supabase
          .from('campaigns')
          .update({
            recaudado: (Number(campaign.recaudado) || 0) + amount,
            donantes_count: (Number(campaign.donantes_count) || 0) + 1
          })
          .eq('id', campaign_id);
      }
    }

    return res.status(200).send('OK');
  } catch (error: any) {
    console.error("[Webhook Error]:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
