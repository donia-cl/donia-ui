
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!id) return res.status(400).json({ success: false, error: 'ID required' });
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ success: false, error: 'Database configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Obtener detalle de la campaña
    const { data: campaign, error: cError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (cError) throw cError;

    // 2. Obtener donaciones recientes
    const { data: donations, error: dError } = await supabase
      .from('donations')
      .select('*')
      .eq('campaign_id', id)
      .order('fecha', { ascending: false })
      .limit(10);

    return res.status(200).json({ 
      success: true, 
      data: { 
        ...campaign, 
        donations: donations || [] 
      } 
    });
  } catch (error: any) {
    console.error("[API/campaign-detail] Error:", error.message);
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }
}
