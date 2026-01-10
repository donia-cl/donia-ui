
import { createClient } from '@supabase/supabase-js';
import { Validator, logger } from './_utils.js';

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

    // 2. Guardar en Base de Datos (Respaldo Histórico)
    // Esto es útil para tener un registro propio independiente de Trello
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        await supabase.from('support_tickets').insert([{
          name,
          email,
          subject,
          message,
          status: 'pending',
          source: 'web_form'
        }]);
      }
    } catch (dbError) {
      console.error("Error guardando en Supabase (no crítico):", dbError);
      // No detenemos el flujo si falla la DB, priorizamos Trello si está configurado
    }

    // 3. Integración con Trello
    const trelloKey = process.env.TRELLO_API_KEY;
    const trelloToken = process.env.TRELLO_TOKEN;
    const trelloListId = process.env.TRELLO_LIST_ID;

    if (trelloKey && trelloToken && trelloListId) {
      // Formateamos la descripción de la tarjeta en Markdown
      const cardDesc = `
**Solicitante:** ${name}
**Email:** ${email}
**Asunto:** ${subject}

---
**Mensaje:**
${message}
      `.trim();

      const trelloParams = new URLSearchParams({
        key: trelloKey,
        token: trelloToken,
        idList: trelloListId,
        name: `🎫 [${subject}] - ${name}`,
        desc: cardDesc,
        pos: 'top' // La tarjeta aparecerá arriba de la lista
      });

      const trelloResp = await fetch(`https://api.trello.com/1/cards?${trelloParams.toString()}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!trelloResp.ok) {
        const trelloError = await trelloResp.text();
        console.error("Error Trello API:", trelloError);
        // Si falla Trello, lanzamos error para que el usuario sepa (o podríamos guardarlo solo en DB y retornar OK)
        throw new Error("Error interno conectando con el sistema de tickets.");
      }

      logger.info('TRELLO_CARD_CREATED', { email, subject });
      
      return res.status(200).json({ success: true, message: "Ticket creado en Trello exitosamente" });

    } else {
      // Fallback si no hay credenciales de Trello configuradas
      console.warn("Faltan credenciales de Trello. El mensaje solo se guardó en DB/Logs.");
      return res.status(200).json({ success: true, warning: "Credentials missing for Trello integration" });
    }

  } catch (error: any) {
    console.error('CONTACT_API_ERROR', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
