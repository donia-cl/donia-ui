import { createClient } from '@supabase/supabase-js';
import { Validator, logger, Mailer } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Donia-Admin-Key');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { campaignId, monto, nombre, comentario, email, donorUserId } = req.body;
    
    const adminKey = req.headers['x-donia-admin-key'];
    const expectedKey = process.env.ADMIN_SECRET_KEY || 'donia_dev_2026';

    if (adminKey !== expectedKey) {
      logger.error('UNAUTHORIZED_SIMULATED_DONATION_ATTEMPT', { ip: req.headers['x-forwarded-for'] });
      return res.status(401).json({ 
        success: false, 
        error: "No tienes permisos para realizar donaciones simuladas." 
      });
    }

    Validator.uuid(campaignId, 'campaignId');
    Validator.number(monto, 500, 'monto');
    Validator.email(email);

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuración de base de datos incompleta.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: campaign, error: cFetchError } = await supabase
      .from('campaigns')
      .select('id, titulo, recaudado, donantes_count')
      .eq('id', campaignId)
      .single();

    if (cFetchError || !campaign) {
      return res.status(404).json({ success: false, error: "Campaña no encontrada." });
    }

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

    await supabase.from('campaigns').update({
      recaudado: (Number(campaign.recaudado) || 0) + Number(monto),
      donantes_count: (Number(campaign.donantes_count) || 0) + 1
    }).eq('id', campaignId);

    if (email) {
      await Mailer.sendDonationReceipt(
        email,
        nombre || 'Amigo de Donia',
        Number(monto),
        campaign.titulo || 'Campaña Donia',
        campaignId
      );
    }

    logger.audit(donorUserId || 'anonymous', 'DONATION_CREATED_SIMULATED', donation.id, { 
      campaignId, 
      amount: monto 
    });

    return res.status(200).json({ success: true, data: donation });

  } catch (error: any) {
    logger.error('DONATE_ENDPOINT_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}