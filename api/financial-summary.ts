
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'User ID required' });

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'DB config missing' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Obtener todas las campañas del usuario
    const { data: campaigns, error: cError } = await supabase
      .from('campaigns')
      .select('recaudado, id')
      .eq('user_id', userId);

    if (cError) throw cError;

    // 2. Obtener retiros realizados
    const { data: withdrawals, error: wError } = await supabase
      .from('withdrawals')
      .select('monto, estado')
      .eq('user_id', userId);

    const totalRecaudado = campaigns.reduce((acc, c) => acc + (Number(c.recaudado) || 0), 0);
    const totalRetirado = (withdrawals || [])
      .filter(w => w.estado === 'completado')
      .reduce((acc, w) => acc + (Number(w.monto) || 0), 0);
    const enProceso = (withdrawals || [])
      .filter(w => w.estado === 'pendiente')
      .reduce((acc, w) => acc + (Number(w.monto) || 0), 0);
    
    // El disponible es el total menos lo ya retirado y lo que está en proceso
    const disponibleRetiro = Math.max(0, totalRecaudado - totalRetirado - enProceso);

    return res.status(200).json({
      success: true,
      data: {
        totalRecaudado,
        disponibleRetiro,
        enProceso,
        totalRetirado
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
