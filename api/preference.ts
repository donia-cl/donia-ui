
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

  // WEBHOOK: Mercado Pago envía notificaciones aquí
  if (req.method === 'POST' && req.body.type === 'payment' && !action) {
    const { data } = req.body;
    try {
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, { 
        headers: { 'Authorization': `Bearer ${accessToken}` } 
      });
      const payment = await mpResp.json();
      
      if (payment.status === 'approved') {
        const { campaign_id, donor_name, donor_comment, donor_email, donor_user_id } = payment.metadata;
        const amount = payment.transaction_amount;
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        // Evitar duplicados verificando si el payment_id ya existe
        const { data: existing } = await supabase.from('donations').select('id').eq('payment_id', String(payment.id)).maybeSingle();
        
        if (!existing) {
          await supabase.from('donations').insert([{ 
            campaign_id, 
            monto: amount, 
            nombre_donante: donor_name, 
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
        }
      }
      return res.status(200).send('OK');
    } catch (e) { return res.status(500).send('Error'); }
  }

  // CREAR PREFERENCIA (Checkout Pro)
  if (action === 'preference') {
    const { campaignId, monto, nombre, comentario, campaignTitle, email, donorUserId } = req.body; 
    
    // URL de retorno basada en el referer o absoluta si es necesario
    const returnUrl = req.headers.referer || `${req.headers.origin}/#/campana/${campaignId}/donar`;

    const preference = { 
      items: [{ 
        id: campaignId, 
        title: `Donación Donia: ${campaignTitle}`, 
        quantity: 1, 
        unit_price: Number(monto), 
        currency_id: 'CLP' 
      }], 
      payer: {
        email: email || 'donor@donia.cl',
        name: nombre || 'Donante'
      },
      payment_methods: {
        excluded_payment_types: [
            { id: "ticket" } // Excluimos pagos en efectivo (Sencillito/Servipag) para evitar campañas "pendientes" eternamente
        ],
        installments: 1 // Forzamos 1 cuota para donaciones
      },
      metadata: { 
        campaign_id: campaignId, 
        donor_name: nombre, 
        donor_comment: comentario,
        donor_email: email,
        donor_user_id: donorUserId
      }, 
      back_urls: { 
        success: returnUrl,
        failure: returnUrl,
        pending: returnUrl
      }, 
      auto_return: 'approved',
      binary_mode: true // Solo aprobados o rechazados, sin estados intermedios raros
    };

    try {
      const resp = await fetch('https://api.mercadopago.com/checkout/preferences', { 
        method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${accessToken}`, 
          'Content-Type': 'application/json' 
        }, 
        body: JSON.stringify(preference) 
      });
      
      const data = await resp.json();
      
      if (!resp.ok) {
          return res.status(500).json({ success: false, error: data.message });
      }

      // init_point es la URL de producción, sandbox_init_point es para pruebas
      return res.status(200).json({ 
        success: true, 
        preference_id: data.id,
        init_point: data.init_point 
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(404).end();
}
