
import { createClient } from '@supabase/supabase-js';
import { Validator, logger } from './_utils.js';

// Mapa de traducción de asuntos (Backend)
const SUBJECT_TRANSLATIONS: Record<string, string> = {
  'report': 'Reportar una campaña',
  'payment': 'Problema con un pago',
  'withdraw': 'Problema con retiros',
  'account': 'Acceso a mi cuenta',
  'other': 'Otro tema'
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, email, subject, message } = req.body;

    // 1. Validaciones
    Validator.required(name, 'Nombre');
    Validator.email(email);
    Validator.required(subject, 'Asunto');
    Validator.string(message, 10, 'Mensaje');

    // Traducir el asunto técnico a español para humanos
    const displaySubject = SUBJECT_TRANSLATIONS[subject] || subject;

    // 2. Guardar en Base de Datos (Respaldo Histórico)
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        await supabase.from('support_tickets').insert([{
          name,
          email,
          subject: displaySubject, // Guardamos la versión traducida también en DB
          message,
          status: 'pending',
          source: 'web_form'
        }]);
      }
    } catch (dbError) {
      console.error("Error guardando en Supabase (no crítico):", dbError);
    }

    // 3. Integración con Trello (No bloqueante)
    const trelloKey = process.env.TRELLO_API_KEY ? process.env.TRELLO_API_KEY.trim() : '';
    const trelloToken = process.env.TRELLO_TOKEN ? process.env.TRELLO_TOKEN.trim() : '';
    const trelloListId = process.env.TRELLO_LIST_ID ? process.env.TRELLO_LIST_ID.trim() : '';

    // Log de diagnóstico
    console.log(`[Trello Debug] Key Length: ${trelloKey.length}, Token Length: ${trelloToken.length}, ListID: ${trelloListId}`);

    if (trelloKey && trelloToken && trelloListId) {
      try {
        const cardDesc = `
**Solicitante:** ${name}
**Email:** ${email}
**Asunto:** ${displaySubject}

---
**Mensaje:**
${message}
        `.trim();

        const trelloParams = new URLSearchParams({
          key: trelloKey,
          token: trelloToken,
          idList: trelloListId,
          name: `🎫 [${displaySubject}] - ${name}`, // Usamos el asunto traducido aquí
          desc: cardDesc,
          pos: 'top'
        });

        const trelloResp = await fetch(`https://api.trello.com/1/cards?${trelloParams.toString()}`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!trelloResp.ok) {
          const trelloError = await trelloResp.text();
          console.error(`Error Trello API (${trelloResp.status}):`, trelloError);
        } else {
          logger.info('TRELLO_CARD_CREATED', { email, subject });
        }
      } catch (trelloEx) {
        console.error("Error de conexión con Trello:", trelloEx);
      }
    } else {
      console.warn("Faltan credenciales de Trello. Revise las variables de entorno.");
    }

    return res.status(200).json({ success: true, message: "Mensaje recibido correctamente" });

  } catch (error: any) {
    console.error('CONTACT_API_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
