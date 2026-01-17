import { createClient } from '@supabase/supabase-js';
import { Validator, logger, Mailer } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { paymentData, campaignId, metadata } = req.body;
    
    Validator.required(paymentData, 'paymentData');
    Validator.uuid(campaignId, 'campaignId');
    Validator.email(metadata.email);

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!accessToken || !supabaseUrl || !serviceRoleKey) throw new Error('Credenciales faltantes.');

    const paymentPayload = {
      ...paymentData,
      description: `Donación Donia - Campaña ${campaignId}`,
      payer: { ...(paymentData.payer || {}), email: metadata.email, first_name: metadata.nombre || 'Anónimo' },
      metadata: {
        campaign_id: campaignId,
        campaign_title: metadata.campaignTitle || 'Campaña Donia',
        donor_user_id: metadata.donorUserId || null,
        donor_name: metadata.nombre || 'Anónimo',
        donor_email: metadata.email,
        donor_comment: metadata.comentario || ''
      },
      binary_mode: true 
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    });

    const paymentResult = await mpResponse.json();
    if (!mpResponse.ok) throw new Error(paymentResult.message || 'Error Mercado Pago');

    const isSuccess = paymentResult.status === 'approved';

    if (isSuccess || paymentResult.status === 'pending') {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const amount = paymentResult.transaction_amount;

        await supabase.from('donations').insert([{
          campaign_id: campaignId,
          monto: amount,
          nombre_donante: metadata.nombre || 'Anónimo',
          donor_email: metadata.email,
          donor_user_id: metadata.donorUserId || null,
          comentario: metadata.comentario || '',
          payment_provider: 'mercado_pago',
          payment_id: String(paymentResult.id),
          status: isSuccess ? 'completed' : 'pending'
        }]);

        if (isSuccess) {
            const { data: campaign } = await supabase.from('campaigns').select('recaudado, donantes_count, titulo').eq('id', campaignId).single();
            if (campaign) {
              await supabase.from('campaigns').update({
                recaudado: (Number(campaign.recaudado) || 0) + amount,
                donantes_count: (Number(campaign.donantes_count) || 0) + 1
              }).eq('id', campaignId);

              if (metadata.email) {
                await Mailer.sendDonationReceipt(
                  metadata.email,
                  metadata.nombre || 'Amigo de Donia',
                  amount,
                  campaign.titulo || 'una causa',
                  campaignId
                );
              }
            }
        }
    }

    return res.status(200).json({ success: true, status: paymentResult.status, id: paymentResult.id });
  } catch (error: any) {
    logger.error('PROCESS_PAYMENT_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}