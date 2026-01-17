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
      return res.status(401).json({ success: false, error: "No autorizado." });
    }

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // 1. Obtener campaña y DUEÑO
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('id, titulo, monto, recaudado, donantes_count, owner_id')
      .eq('id', campaignId)
      .single();

    if (cError || !campaign) throw new Error("Campaña no encontrada.");

    const montoDonacion = Number(monto);
    const nuevoRecaudado = (Number(campaign.recaudado) || 0) + montoDonacion;
    const metaAlcanzadaJustoAhora = nuevoRecaudado >= Number(campaign.monto) && (Number(campaign.recaudado) < Number(campaign.monto));

    // 2. Insertar donación
    const { data: donation, error: dError } = await supabase.from('donations').insert([{ 
      campaign_id: campaignId, 
      monto: montoDonacion, 
      nombre_donante: nombre || 'Anónimo',
      donor_email: email, 
      donor_user_id: donorUserId || null,
      comentario: comentario || null,
      status: 'completed'
    }]).select().single();

    if (dError) throw dError;

    // 3. Actualizar campaña
    await supabase.from('campaigns').update({
      recaudado: nuevoRecaudado,
      donantes_count: (Number(campaign.donantes_count) || 0) + 1
    }).eq('id', campaignId);

    // 4. NOTIFICACIONES
    // Al Donante
    if (email) {
      await Mailer.sendDonationReceipt(email, nombre || 'Amigo de Donia', montoDonacion, campaign.titulo, campaignId);
    }

    // Al Dueño
    if (campaign.owner_id) {
      const { data: ownerAuth } = await (supabase.auth as any).admin.getUserById(campaign.owner_id);
      const { data: ownerProfile } = await supabase.from('profiles').select('full_name').eq('id', campaign.owner_id).single();
      
      if (ownerAuth?.user?.email) {
        // Enviar aviso de nueva donación normal
        await Mailer.sendOwnerDonationNotification(
          ownerAuth.user.email,
          ownerProfile?.full_name || 'Creador de Campaña',
          nombre || 'Un donante anónimo',
          montoDonacion,
          campaign.titulo,
          comentario
        );

        // Si justo con este pago se llegó a la meta, enviar el correo especial de celebración
        if (metaAlcanzadaJustoAhora) {
          await Mailer.sendGoalReachedNotification(
            ownerAuth.user.email,
            ownerProfile?.full_name || 'Creador de Campaña',
            campaign.titulo,
            nuevoRecaudado
          );
        }
      }
    }

    return res.status(200).json({ success: true, data: donation });

  } catch (error: any) {
    logger.error('DONATE_SIMULATED_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}