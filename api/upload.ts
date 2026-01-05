
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, name } = req.body;
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase config missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Limpiar el base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    
    // Fix: Explicitly use the imported Buffer class to avoid name collision and ensure it's available in the scope
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${Date.now()}-${name}`;

    const { data, error } = await supabase.storage
      .from('campaign-images')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('campaign-images')
      .getPublicUrl(fileName);

    return res.status(200).json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("[API/upload] Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
