
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select(`
        id,
        monto,
        fecha,
        estado,
        campaign_id,
        campaigns ( titulo )
      `)
      .eq('user_id', userId)
      .order('fecha', { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((w: any) => ({
      id: w.id,
      monto: w.monto,
      fecha: w.fecha,
      estado: w.estado,
      campaignId: w.campaign_id,
      campaignTitle: w.campaigns?.titulo || 'Campaña eliminada'
    }));

    return res.status(200).json({ success: true, data: mapped });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
