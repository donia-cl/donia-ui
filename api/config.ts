
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); 
  res.setHeader('Connection', 'keep-alive');
  
  // Intentamos leer la llave pública con varios prefijos comunes para evitar errores de configuración en Vercel
  const mpPublicKey = 
    process.env.REACT_APP_MP_PUBLIC_KEY || 
    process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 
    process.env.MP_PUBLIC_KEY || 
    '';

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.VITE_SUPABASE_KEY;
  
  return res.status(200).json({
    supabaseUrl: supabaseUrl,
    supabaseKey: supabaseKey,
    mpPublicKey: mpPublicKey, 
    aiEnabled: !!process.env.API_KEY
  });
}
