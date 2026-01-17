import { createClient } from '@supabase/supabase-js';
import { Validator, logger, Mailer } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, campaignId, monto } = req.body;

    Validator.required(userId, 'userId');
    Validator.uuid(campaignId, 'campaignId');
    Validator.number(monto, 1000, 'monto');

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    // 1. Validar Perfil (RUT y Teléfono obligatorios para cobrar)
    const { data: profile } = await supabase.from('profiles').select('full_name, rut, phone').eq('id', userId).single();
    if (!profile?.rut || !profile?.phone) {
      return res.status(400).json({ success: false, error: "Debes completar tu RUT y Teléfono en tu perfil antes de solicitar un retiro." });
    }

    // 2. Validar Campaña y Propiedad
    const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
    if (!campaign || campaign.owner_id !== userId) {
      return res.status(403).json({ success: false, error: "No tienes permisos sobre esta campaña." });
    }

    // 3. Validar que esté FINALIZADA
    const now = new Date().toISOString();
    const isFinished = campaign.estado === 'finalizada' || (campaign.fecha_termino && campaign.fecha_termino < now);
    if (!isFinished) {
      return res.status(400).json({ success: false, error: "Esta campaña aún está activa. Solo puedes retirar fondos una vez que la campaña finalice." });
    }

    // 4. Validar Fondos Disponibles
    const { data: withdrawals } = await supabase.from('withdrawals').select('monto').eq('campaign_id', campaignId).in('estado', ['pendiente', 'completado']);
    const yaRetirado = (withdrawals || []).reduce((acc, w) => acc + Number(w.monto), 0);
    const disponible = Number(campaign.recaudado) - yaRetirado;

    if (monto > disponible) {
      return res.status(400).json({ success: false, error: `Monto excede el disponible ($${disponible.toLocaleString('es-CL')}).` });
    }

    // 5. Registrar Solicitud
    const { data: withdrawal, error: wError } = await supabase.from('withdrawals').insert([{
      user_id: userId,
      campaign_id: campaignId,
      monto: Number(monto),
      estado: 'pendiente',
      fecha: new Date().toISOString()
    }]).select().single();

    if (wError) throw wError;

    // 6. Notificar por Correo
    const { data: authUser } = await (supabase.auth as any).admin.getUserById(userId);
    if (authUser?.user?.email) {
      await Mailer.sendWithdrawalConfirmation(
        authUser.user.email,
        profile.full_name,
        Number(monto),
        campaign.titulo
      );
    }

    logger.audit(userId, 'WITHDRAWAL_REQUESTED', withdrawal.id, { campaignId, monto });

    return res.status(200).json({ success: true, data: withdrawal });

  } catch (error: any) {
    logger.error('WITHDRAWAL_API_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}