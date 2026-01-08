
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { userId, type } = req.query;

  if (!userId) return res.status(400).json({ error: 'Se requiere ID de usuario' });

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, serviceRoleKey!);

  try {
    if (type === 'summary') {
      // Cálculo de saldos
      const { data: campaigns } = await supabase.from('campaigns').select('recaudado').eq('user_id', userId);
      const { data: withdrawals } = await supabase.from('withdrawals').select('monto, estado').eq('user_id', userId);

      const totalRecaudado = (campaigns || []).reduce((acc, c) => acc + (Number(c.recaudado) || 0), 0);
      const totalRetirado = (withdrawals || []).filter(w => w.estado === 'completado').reduce((acc, w) => acc + (Number(w.monto) || 0), 0);
      const enProceso = (withdrawals || []).filter(w => w.estado === 'pendiente').reduce((acc, w) => acc + (Number(w.monto) || 0), 0);
      const disponibleRetiro = Math.max(0, totalRecaudado - totalRetirado - enProceso);

      return res.status(200).json({ 
        success: true, 
        data: { totalRecaudado, disponibleRetiro, enProceso, totalRetirado } 
      });
    } else if (type === 'withdrawals') {
      // Listado de retiros
      const { data, error } = await supabase
        .from('withdrawals')
        .select('id, monto, fecha, estado, campaign_id, campaigns(titulo)')
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
    }
    return res.status(400).json({ error: 'Tipo de consulta no válido' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
