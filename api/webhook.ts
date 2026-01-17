import { createClient } from '@supabase/supabase-js';
import { Mailer, logger } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (type !== 'payment') return res.status(200).send('OK');

  try {
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!mpResponse.ok) throw new Error(`Mercado Pago API error: ${mpResponse.status}`);

    const payment = await mpResponse.json();

    if (payment.status === 'approved') {
      const { campaign_id, donor_name, donor_comment, donor_email, donor_user_id, campaign_title } = payment.metadata;
      const amount = payment.transaction_amount;

      if (!supabaseUrl || !serviceRoleKey) throw new Error("Configuración DB ausente");
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const { data: existing } = await supabase.from('donations').select('id').eq('payment_id', String(payment.id)).maybeSingle();

      if (!existing) {
        await supabase.from('donations').insert([{
          campaign_id: campaign_id,
          monto: amount,
          nombre_donante: donor_name || 'Anónimo',
          donor_email: donor_email,
          donor_user_id: donor_user_id || null,
          comentario: donor_comment,
          payment_provider: 'mercado_pago',
          payment_id: String(payment.id),
          status: 'completed'
        }]);

        const { data: campaign } = await supabase.from('campaigns').select('recaudado, donantes_count').eq('id', campaign_id).single();

        if (campaign) {
          await supabase.from('campaigns').update({
            recaudado: (Number(campaign.recaudado) || 0) + amount,
            donantes_count: (Number(campaign.donantes_count) || 0) + 1
          }).eq('id', campaign_id);
        }

        if (donor_email) {
          await Mailer.sendDonationReceipt(
            donor_email, 
            donor_name || 'Amigo de Donia', 
            amount, 
            campaign_title || 'una causa',
            campaign_id
          );
        }
      }
    }

    return res.status(200).send('OK');
  } catch (error: any) {
    logger.error("WEBHOOK_ERROR", error);
    return res.status(500).json({ error: error.message });
  }
}