import { createClient } from '@supabase/supabase-js';
import { Mailer, logger } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (req.method === 'POST' && req.body.type === 'payment' && !action) {
    const { data } = req.body;
    try {
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, { 
        headers: { 'Authorization': `Bearer ${accessToken}` } 
      });
      const payment = await mpResp.json();
      
      if (payment.status === 'approved') {
        const { campaign_id, donor_name, donor_comment, donor_email, donor_user_id, campaign_title } = payment.metadata;
        const amount = payment.transaction_amount;
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        const { data: existing } = await supabase.from('donations').select('id').eq('payment_id', String(payment.id)).maybeSingle();
        
        if (!existing) {
          await supabase.from('donations').insert([{ 
            campaign_id, 
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
    } catch (e) { 
      logger.error('WEBHOOK_PROCESS_ERROR', e);
      return res.status(500).send('Error'); 
    }
  }

  if (action === 'preference') {
    const { campaignId, monto, nombre, comentario, campaignTitle, email, donorUserId } = req.body; 
    const baseUrl = req.headers.origin || 'https://donia.cl';
    const returnUrl = `${baseUrl}/campana/${campaignId}/donar`;

    const preference = { 
      items: [{ id: campaignId, title: `Donación Donia: ${campaignTitle}`, quantity: 1, unit_price: Number(monto), currency_id: 'CLP' }], 
      payer: { email: email || 'donor@donia.cl', name: nombre || 'Donante' },
      metadata: { campaign_id: campaignId, campaign_title: campaignTitle, donor_name: nombre, donor_comment: comentario, donor_email: email, donor_user_id: donorUserId }, 
      back_urls: { success: returnUrl, failure: returnUrl, pending: returnUrl }, 
      auto_return: 'approved',
      binary_mode: true 
    };

    try {
      const resp = await fetch('https://api.mercadopago.com/checkout/preferences', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify(preference) 
      });
      const data = await resp.json();
      return res.status(200).json({ success: true, preference_id: data.id, init_point: data.init_point });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(404).end();
}