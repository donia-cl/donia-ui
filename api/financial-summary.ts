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
      const now = new Date().toISOString();
      
      // Obtener todas las campañas del usuario
      const { data: campaigns, error: cError } = await supabase
        .from('campaigns')
        .select('id, titulo, recaudado, estado, fecha_termino')
        .eq('owner_id', userId); 

      if (cError) throw cError;

      // Obtener retiros realizados o pendientes
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('monto, estado, campaign_id')
        .eq('user_id', userId);

      const withdrawalData = withdrawals || [];

      // Lógica de Disponibilidad: Solo campañas finalizadas o con fecha vencida
      let totalRecaudado = 0;
      let disponibleRetiro = 0;
      let enCursoNoDisponible = 0;

      campaigns?.forEach(c => {
        const montoRecaudado = Number(c.recaudado) || 0;
        totalRecaudado += montoRecaudado;

        const isFinished = c.estado === 'finalizada' || (c.fecha_termino && c.fecha_termino < now);
        
        if (isFinished) {
          // Calcular cuánto de esta campaña ya se retiró o está en proceso
          const descontado = withdrawalData
            .filter(w => w.campaign_id === c.id && (w.estado === 'completado' || w.estado === 'pendiente'))
            .reduce((acc, w) => acc + (Number(w.monto) || 0), 0);
          
          disponibleRetiro += Math.max(0, montoRecaudado - descontado);
        } else {
          enCursoNoDisponible += montoRecaudado;
        }
      });

      const totalRetirado = withdrawalData
        .filter(w => w.estado === 'completado')
        .reduce((acc, w) => acc + (Number(w.monto) || 0), 0);
        
      const enProceso = withdrawalData
        .filter(w => w.estado === 'pendiente')
        .reduce((acc, w) => acc + (Number(w.monto) || 0), 0);

      return res.status(200).json({ 
        success: true, 
        data: { 
          totalRecaudado, 
          disponibleRetiro, 
          enProceso, 
          totalRetirado,
          enCursoNoDisponible // Informamos lo que está "atrapado" en campañas activas
        } 
      });
    }
    return res.status(400).json({ error: 'Tipo de consulta no válido' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}