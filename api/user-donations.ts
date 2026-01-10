
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Configuración incompleta en servidor' });
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Obtener donaciones del usuario
    const { data: donationsData, error: dError } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_user_id', userId)
      .order('fecha', { ascending: false }); // CORREGIDO: Usar 'fecha' en lugar de 'created_at'

    if (dError) throw dError;

    if (!donationsData || donationsData.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 2. Obtener IDs únicos de campañas para hacer un "Join Manual" seguro
    // Esto evita errores 500 si la Foreign Key no está perfectamente configurada en Supabase
    const campaignIds = [...new Set(donationsData.map((d: any) => d.campaign_id).filter(Boolean))];

    let campaignsMap: Record<string, any> = {};

    if (campaignIds.length > 0) {
      const { data: campaignsData, error: cError } = await supabase
        .from('campaigns')
        .select('id, titulo, imagen_url')
        .in('id', campaignIds);
        
      if (!cError && campaignsData) {
        campaignsData.forEach((c: any) => {
          campaignsMap[c.id] = c;
        });
      }
    }

    // 3. Combinar datos manualmente
    const donations = donationsData.map((d: any) => {
      const campaign = campaignsMap[d.campaign_id] || {};
      
      return {
        id: d.id,
        campaignId: d.campaign_id,
        monto: d.monto,
        fecha: d.fecha || d.created_at, // Soporte para ambos
        nombreDonante: d.nombre_donante,
        emailDonante: d.donor_email,
        comentario: d.comentario,
        status: d.status || 'completed',
        paymentId: d.payment_id,
        campaign: {
          titulo: campaign.titulo || 'Campaña no disponible',
          imagenUrl: campaign.imagen_url || 'https://picsum.photos/200/200'
        }
      };
    });

    return res.status(200).json({ success: true, data: donations });
  } catch (error: any) {
    console.error("[API/user-donations] Fatal Error:", error.message);
    // Retornamos array vacío en caso de error grave para no romper el frontend
    return res.status(200).json({ success: false, error: error.message, data: [] });
  }
}
