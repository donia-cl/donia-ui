
import { createClient } from '@supabase/supabase-js';
import { Validator, logger } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { campaignId, monto, nombre, comentario, email, donorUserId } = req.body;

    Validator.uuid(campaignId, 'campaignId');
    Validator.number(monto, 500, 'monto');
    Validator.email(email);

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing for donation processing.");
      throw new Error('Configuración de base de datos incompleta.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const donationData: any = { 
      campaign_id: campaignId, 
      monto: Number(monto), 
      nombre_donante: nombre || 'Anónimo',
      donor_email: email, 
      donor_user_id: donorUserId || null,
      comentario: comentario || null,
      payment_provider: 'simulated',
      status: 'completed'
    };

    const { data: donation, error: dError } = await supabase
      .from('donations')
      .insert([donationData])
      .select()
      .single();

    if (dError) throw dError;

    logger.audit(donorUserId || 'anonymous', 'DONATION_CREATED', donation.id, { 
      campaignId, 
      amount: monto 
    });

    const { data: campaign } = await supabase.from('campaigns').select('recaudado, donantes_count').eq('id', campaignId).single();
    if (campaign) {
      await supabase.from('campaigns').update({
          recaudado: (Number(campaign.recaudado) || 0) + Number(monto),
          donantes_count: (Number(campaign.donantes_count) || 0) + 1
        }).eq('id', campaignId);
    }

    return res.status(200).json({ success: true, data: donation });

  } catch (error: any) {
    logger.error('DONATE_ENDPOINT_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
