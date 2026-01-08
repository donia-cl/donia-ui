import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { userId, type } = req.query;

  if (!userId) return res.status(400).json({ error: 'Se requiere ID de usuario' });

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
     return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (type === 'summary') {
      const { data: campaigns, error: cError } = await supabase.from('campaigns').select('recaudado').eq('owner_id', userId); 
      const { data: withdrawals, error: wError } = await supabase.from('withdrawals').select('monto, estado').eq('user_id', userId); 

      if (cError || wError) {
        console.error("Error fetching financial data:", cError || wError);
        // Fail safe: return zeros
        return res.status(200).json({ success: true, data: { totalRecaudado: 0, disponibleRetiro: 0, enProceso: 0, totalRetirado: 0 } });
      }

      const totalRecaudado = (campaigns || []).reduce((acc, c) => acc + (Number(c.recaudado) || 0), 0);
      const totalRetirado = (withdrawals || []).filter(w => w.estado === 'completado').reduce((acc, w) => acc + (Number(w.monto) || 0), 0);
      const enProceso = (withdrawals || []).filter(w => w.estado === 'pendiente').reduce((acc, w) => acc + (Number(w.monto) || 0), 0);
      const disponibleRetiro = Math.max(0, totalRecaudado - totalRetirado - enProceso);

      return res.status(200).json({ 
        success: true, 
        data: { totalRecaudado, disponibleRetiro, enProceso, totalRetirado } 
      });
    } else if (type === 'withdrawals') {
      // Legacy support, should use withdrawals.ts endpoint instead
      return res.status(200).json({ success: true, data: [] });
    }
    return res.status(400).json({ error: 'Tipo de consulta no válido' });
  } catch (error: any) {
    console.error("Financial Summary Error:", error);
    return res.status(500).json({ error: error.message });
  }
}