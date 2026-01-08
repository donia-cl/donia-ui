
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  try {
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        campaigns (
          titulo,
          imagen_url
        )
      `)
      .eq('donor_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Mapeo para ajustar al frontend
    const donations = (data || []).map((d: any) => ({
      id: d.id,
      campaignId: d.campaign_id,
      monto: d.monto,
      fecha: d.created_at,
      nombreDonante: d.nombre_donante,
      emailDonante: d.donor_email,
      comentario: d.comentario,
      status: d.status || 'completed', // Default a completed si no existe en DB antigua
      paymentId: d.payment_id,
      campaign: {
        titulo: d.campaigns?.titulo || 'Campaña eliminada',
        imagenUrl: d.campaigns?.imagen_url || ''
      }
    }));

    return res.status(200).json({ success: true, data: donations });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
