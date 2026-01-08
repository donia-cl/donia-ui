
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
      // 1. Obtener Campañas (Crítico para Total Recaudado)
      const { data: campaigns, error: cError } = await supabase
        .from('campaigns')
        .select('recaudado')
        .eq('owner_id', userId); 

      if (cError) {
        console.error("Error fetching campaigns for summary:", cError);
        // Si fallan las campañas, no podemos calcular ingresos.
        return res.status(200).json({ success: true, data: { totalRecaudado: 0, disponibleRetiro: 0, enProceso: 0, totalRetirado: 0 } });
      }

      // 2. Obtener Retiros (Resiliente: si falla, asumimos 0)
      let withdrawals: any[] = [];
      const { data: wData, error: wError } = await supabase
        .from('withdrawals')
        .select('monto, estado')
        .eq('user_id', userId);
      
      if (wError) {
        // Solo advertimos, no bloqueamos el flujo principal
        console.warn("Warning: No se pudieron leer retiros (tabla inexistente o error):", wError.message);
      } else if (wData) {
        withdrawals = wData;
      }

      // 3. Cálculos
      const totalRecaudado = (campaigns || []).reduce((acc, c) => acc + (Number(c.recaudado) || 0), 0);
      
      const totalRetirado = withdrawals
        .filter((w: any) => w.estado === 'completado')
        .reduce((acc, w: any) => acc + (Number(w.monto) || 0), 0);
        
      const enProceso = withdrawals
        .filter((w: any) => w.estado === 'pendiente')
        .reduce((acc, w: any) => acc + (Number(w.monto) || 0), 0);
      
      const disponibleRetiro = Math.max(0, totalRecaudado - totalRetirado - enProceso);

      return res.status(200).json({ 
        success: true, 
        data: { totalRecaudado, disponibleRetiro, enProceso, totalRetirado } 
      });
    } else if (type === 'withdrawals') {
      return res.status(200).json({ success: true, data: [] });
    }
    return res.status(400).json({ error: 'Tipo de consulta no válido' });
  } catch (error: any) {
    console.error("Financial Summary Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
