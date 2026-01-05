
export default async function handler(req: any, res: any) {
  // Solo entregamos las llaves PÚBLICAS (anon), nunca la service_role
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  return res.status(200).json({
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
    supabaseKey: process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    mpPublicKey: process.env.REACT_APP_MP_PUBLIC_KEY
  });
}
