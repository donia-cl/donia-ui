
import { createClient } from '@supabase/supabase-js';
import { Validator, logger } from './utils';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { paymentData, campaignId, metadata } = req.body;
    
    // 1. Validación de Inputs
    Validator.required(paymentData, 'paymentData');
    Validator.uuid(campaignId, 'campaignId');
    Validator.email(metadata.email);

    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Pagos requieren Service Role por seguridad

    if (!accessToken) throw new Error('Mercado Pago Access Token ausente.');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('DB Config ausente.');

    // 2. Procesar el pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pay-${Date.now()}-${Math.random()}`
      },
      body: JSON.stringify({
        ...paymentData,
        description: `Donación Donia - Campaña ${campaignId}`,
        payer: {
          email: metadata.email 
        },
        metadata: {
          campaign_id: campaignId,
          donor_name: metadata.nombre || 'Anónimo',
          donor_email: metadata.email, 
          donor_user_id: metadata.donorUserId || null,
          donor_comment: metadata.comentario || ''
        }
      }),
    });

    const paymentResult = await mpResponse.json();

    if (!mpResponse.ok) {
      logger.error('MP_API_ERROR', paymentResult);
      throw new Error(paymentResult.message || 'Error en la pasarela de pago');
    }

    // 3. Auditoría y Persistencia
    logger.info('PAYMENT_PROCESSED', { 
        id: paymentResult.id, 
        status: paymentResult.status, 
        amount: paymentResult.transaction_amount 
    });

    if (paymentResult.status === 'approved') {
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
          status: 'completed'
        }]);

        const { data: campaign } = await supabase
          .from('campaigns')
          .select('recaudado, donantes_count')
          .eq('id', campaignId)
          .single();

        if (campaign) {
          await supabase.from('campaigns').update({
            recaudado: (Number(campaign.recaudado) || 0) + amount,
            donantes_count: (Number(campaign.donantes_count) || 0) + 1
          }).eq('id', campaignId);
        }
    }

    return res.status(200).json({ 
      success: true, 
      status: paymentResult.status,
      status_detail: paymentResult.status_detail,
      id: paymentResult.id 
    });

  } catch (error: any) {
    logger.error('PROCESS_PAYMENT_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
