
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, userId } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  try {
    const { data: campaign } = await supabase.from('campaigns').select('owner_id, recaudado').eq('id', id).single();
    
    // Verificación con owner_id
    if (!campaign || campaign.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (campaign.recaudado > 0) return res.status(400).json({ error: 'Cannot delete campaign with donations' });
    
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
