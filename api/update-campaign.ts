
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
    // Verificamos que sea el dueño
    const { data: campaign } = await supabase.from('campaigns').select('user_id').eq('id', id).single();
    if (!campaign || campaign.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to edit this campaign' });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return res.status(200).json({ success: true, data: data[0] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
