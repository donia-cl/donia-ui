
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // WEBHOOK: Mercado Pago envía notificaciones aquí sin 'action'
  if (req.method === 'POST' && req.body.type === 'payment' && !action) {
    const { data } = req.body;
    try {
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, { 
        headers: { 'Authorization': `Bearer ${accessToken}` } 
      });
      const payment = await mpResp.json();
      
      if (payment.status === 'approved') {
        const { campaign_id, donor_name, donor_comment } = payment.metadata;
        const amount = payment.transaction_amount;
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        await supabase.from('donations').insert([{ campaign_id, monto: amount, nombre_donante: donor_name, comentario: donor_comment }]);
        
        const { data: campaign } = await supabase.from('campaigns').select('recaudado, donantes_count').eq('id', campaign_id).single();
        if (campaign) {
          await supabase.from('campaigns').update({ 
            recaudado: (Number(campaign.recaudado) || 0) + amount, 
            donantes_count: (Number(campaign.donantes_count) || 0) + 1 
          }).eq('id', campaign_id);
        }
      }
      return res.status(200).send('OK');
    } catch (e) { return res.status(500).send('Error'); }
  }

  // CREAR PREFERENCIA (Checkout Pro)
  if (action === 'preference') {
    const { campaignId, monto, nombre, comentario, campaignTitle } = req.body;
    const preference = { 
      items: [{ id: campaignId, title: `Donación: ${campaignTitle}`, quantity: 1, unit_price: Number(monto), currency_id: 'CLP' }], 
      metadata: { campaign_id: campaignId, donor_name: nombre, donor_comment: comentario }, 
      back_urls: { success: `${req.headers.referer}?status=success` }, 
      auto_return: 'approved' 
    };
    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', { 
      method: 'POST', 
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, 
      body: JSON.stringify(preference) 
    });
    const data = await resp.json();
    return res.status(200).json({ success: true, preference_id: data.id });
  }

  // PROCESAR PAGO (Bricks / API Directa)
  if (action === 'process') {
    const { paymentData, campaignId, metadata } = req.body;
    const resp = await fetch('https://api.mercadopago.com/v1/payments', { 
      method: 'POST', 
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': `pay-${Date.now()}` }, 
      body: JSON.stringify({ 
        ...paymentData, 
        description: `Donación Donia - Campaña ${campaignId}`, 
        metadata: { campaign_id: campaignId, donor_name: metadata.nombre, donor_comment: metadata.comentario } 
      }) 
    });
    const result = await resp.json();
    if (result.status === 'approved') {
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      await supabase.from('donations').insert([{ campaign_id: campaignId, monto: result.transaction_amount, nombre_donante: metadata.nombre, comentario: metadata.comentario }]);
      const { data: camp } = await supabase.from('campaigns').select('recaudado, donantes_count').eq('id', campaignId).single();
      if (camp) {
        await supabase.from('campaigns').update({ 
          recaudado: (Number(camp.recaudado) || 0) + result.transaction_amount, 
          donantes_count: (Number(camp.donantes_count) || 0) + 1 
        }).eq('id', campaignId);
      }
    }
    return res.status(200).json({ success: true, status: result.status });
  }

  return res.status(404).end();
}
