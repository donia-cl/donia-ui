
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // Cache simple
  
  return res.status(200).json({
    supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
    supabaseKey: process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    mpPublicKey: process.env.REACT_APP_MP_PUBLIC_KEY,
    aiEnabled: !!process.env.API_KEY
  });
}
