
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { paymentData, campaignId, metadata } = req.body;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!accessToken) {
    return res.status(500).json({ success: false, error: 'Mercado Pago Access Token ausente.' });
  }

  try {
    // 1. Procesar el pago en Mercado Pago
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
        metadata: {
          campaign_id: campaignId,
          donor_name: metadata.nombre || 'Anónimo',
          donor_comment: metadata.comentario || ''
        }
      }),
    });

    const paymentResult = await mpResponse.json();

    if (!mpResponse.ok) {
      throw new Error(paymentResult.message || 'Error en la pasarela de pago');
    }

    // 2. Si el pago fue aprobado, actualizamos Supabase
    if (paymentResult.status === 'approved') {
      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const amount = paymentResult.transaction_amount;

        // Registrar donación
        await supabase.from('donations').insert([{
          campaign_id: campaignId,
          monto: amount,
          nombre_donante: metadata.nombre || 'Anónimo',
          comentario: metadata.comentario || ''
        }]);

        // Actualizar totales de campaña
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
    }

    return res.status(200).json({ 
      success: true, 
      status: paymentResult.status,
      status_detail: paymentResult.status_detail,
      id: paymentResult.id 
    });

  } catch (error: any) {
    console.error("[Process Payment Error]:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
