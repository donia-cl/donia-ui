
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
  
  /**
   * NOTA DE SEGURIDAD:
   * No usamos el prefijo REACT_APP_ para SUPABASE_SERVICE_ROLE_KEY.
   * Esto garantiza que la clave solo sea accesible desde el servidor (Vercel)
   * y nunca sea inyectada en el bundle de JavaScript que recibe el cliente.
   */
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'Error de configuración: Faltan llaves de acceso en el servidor.' 
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (!image) throw new Error("No se recibió imagen.");

    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileExt = name.split('.').pop() || 'jpg';
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `campaigns/${timestamp}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('campaign-images')
      .upload(fileName, buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
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
