
import { createClient } from '@supabase/supabase-js';
import { Validator, logger } from './utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, name } = req.body;
    
    if (!image || !name) {
        throw new Error("Faltan datos de la imagen.");
    }
    
    // Validación de tamaño (aprox 7MB en base64 equivalen a ~5MB en disco)
    if (image.length > 7 * 1024 * 1024) {
        throw new Error("El archivo excede el límite permitido.");
    }

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    // FALLBACK: Usar Service Role si existe (ideal), si no, Pública (funciona si RLS del bucket está abierto)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Configuración faltante: Supabase Credentials");
      throw new Error('Error interno de configuración en el servidor.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detección segura de MIME type
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    // Limpieza y conversión segura a Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    // Buffer es global en entorno Node (Vercel)
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
      
    logger.info('IMAGE_UPLOADED', { fileName });

    return res.status(200).json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error('UPLOAD_ERROR:', error);
    return res.status(500).json({ success: false, error: error.message || 'Error al subir imagen' });
  }
}
