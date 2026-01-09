
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, userId, updates } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  try {
    // Verificamos que sea el dueño usando owner_id
    const { data: campaign } = await supabase.from('campaigns').select('owner_id').eq('id', id).single();
    if (!campaign || campaign.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this campaign' });
    }

    // Map camelCase to snake_case
    const dbUpdates: any = { ...updates };
    if (updates.imagenUrl) { dbUpdates.imagen_url = updates.imagenUrl; delete dbUpdates.imagenUrl; }
    if (updates.beneficiarioNombre) { dbUpdates.beneficiario_nombre = updates.beneficiarioNombre; delete dbUpdates.beneficiarioNombre; }
    if (updates.beneficiarioRelacion) { dbUpdates.beneficiario_relacion = updates.beneficiarioRelacion; delete dbUpdates.beneficiarioRelacion; }
    if (updates.duracionDias) { dbUpdates.duracion_dias = updates.duracionDias; delete dbUpdates.duracionDias; }
    if (updates.fechaTermino) { dbUpdates.fecha_termino = updates.fechaTermino; delete dbUpdates.fechaTermino; }

    const { data, error } = await supabase
      .from('campaigns')
      .update(dbUpdates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return res.status(200).json({ success: true, data: data[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
