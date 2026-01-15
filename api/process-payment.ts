
import { createClient } from '@supabase/supabase-js';
import { Validator, logger } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { paymentData, campaignId, metadata } = req.body;
    
    // Validaciones básicas
    Validator.required(paymentData, 'paymentData');
    Validator.uuid(campaignId, 'campaignId');
    Validator.email(metadata.email);

    // Obtenemos variables de entorno del servidor
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!accessToken || !supabaseUrl || !serviceRoleKey) {
        throw new Error('Error de configuración del servidor (Credenciales faltantes).');
    }

    // Procesamos el pago con Mercado Pago
    // Importante: El brick envía un objeto con token, issuer_id, payment_method_id, etc.
    // Nosotros debemos construir el payload final.
    const paymentPayload = {
      ...paymentData, // Incluye token, amount, installments, etc.
      description: `Donación Donia - Campaña ${campaignId}`,
      payer: {
        ...(paymentData.payer || {}), // Preservamos identification si viene del brick
        email: metadata.email,
        first_name: metadata.nombre || 'Anónimo'
      },
      metadata: {
        campaign_id: campaignId,
        donor_user_id: metadata.donorUserId || null,
        donor_comment: metadata.comentario || ''
      },
      // Eliminamos currency_id explícito ya que está causando error en la API v1/payments.
      // Mercado Pago asumirá CLP basado en la cuenta del Access Token.
      binary_mode: true 
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pay-${Date.now()}-${Math.random()}`
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentResult = await mpResponse.json();

    if (!mpResponse.ok) {
      logger.error('MP_API_ERROR', paymentResult);
      // Extraemos mensaje de error legible si existe
      const msg = paymentResult.message || 'Error procesando el pago en la pasarela.';
      throw new Error(msg);
    }

    logger.info('PAYMENT_PROCESSED', { id: paymentResult.id, status: paymentResult.status });

    // Si el pago fue aprobado, guardamos en Supabase
    if (paymentResult.status === 'approved') {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const amount = paymentResult.transaction_amount;

        // Insertar Donación
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

        // Actualizar Campaña
        const { data: campaign } = await supabase.from('campaigns').select('recaudado, donantes_count').eq('id', campaignId).single();
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
      id: paymentResult.id 
    });

  } catch (error: any) {
    logger.error('PROCESS_PAYMENT_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
