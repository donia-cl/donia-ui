
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { campaignId, monto, nombre, comentario, campaignTitle } = req.body;
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'Mercado Pago Access Token no configurado en las variables de entorno.' });
  }

  try {
    const preference = {
      items: [
        {
          id: campaignId,
          title: `Donación para: ${campaignTitle}`,
          quantity: 1,
          unit_price: Number(monto),
          currency_id: 'CLP',
        }
      ],
      // Metadatos cruciales para que el Webhook sepa qué campaña actualizar
      metadata: {
        campaign_id: campaignId,
        donor_name: nombre || 'Anónimo',
        donor_comment: comentario || '',
      },
      // URLs de retorno para el flujo del modal
      back_urls: {
        success: `${req.headers.referer}?status=success`,
        failure: `${req.headers.referer}?status=failure`,
        pending: `${req.headers.referer}?status=pending`,
      },
      auto_return: 'approved',
      // Esta URL debe ser la de tu servidor Vercel una vez desplegado
      notification_url: `https://${req.headers.host}/api/webhook`,
      binary_mode: true, // No permite pagos pendientes (ej: efectivo) si quieres confirmación inmediata
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) throw new Error(data.message || 'Error al crear la preferencia de pago');

    return res.status(200).json({ 
      success: true, 
      preference_id: data.id,
      init_point: data.init_point 
    });
  } catch (error: any) {
    console.error("[MP Preference] Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
