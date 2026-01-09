
import { GoogleGenAI } from "@google/genai";
import { Validator, logger, checkRateLimit } from './utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Rate Limiting (Protección contra abuso de cuota)
    // Usamos la IP de la cabecera x-forwarded-for (estándar en Vercel)
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    checkRateLimit(String(ip), 5, 60000); // Máx 5 peticiones por minuto por IP

    const { story } = req.body;
    
    // 2. Validación
    Validator.required(story, 'story');
    Validator.string(story, 10, 'story'); // Mínimo 10 caracteres

    if (!process.env.API_KEY) {
      throw new Error('AI API Key not configured');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    logger.info('AI_POLISH_REQUEST', { ip, storyLength: story.length });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transforma el siguiente borrador en una historia de campaña de recaudación única, potente y conmovedora. 

TEXTO DEL USUARIO:
"${story}"`,
      config: {
        systemInstruction: "ERES UN PROCESADOR DE TEXTO ESTATICO. TU UNICA FUNCION ES REESCRIBIR EL TEXTO DEL USUARIO. \n\nREGLAS CRITICAS:\n1. NO des opciones (ej. 'Opción 1', 'Opción 2').\n2. NO des consejos ni tips.\n3. NO hables con el usuario ni te presentes.\n4. NO uses encabezados de formato como 'Título:' o 'Historia:'.\n5. SOLO entrega el texto final de la historia de la campaña, listo para ser pegado en un formulario.\n6. Usa un tono chileno: cercano, honesto, emotivo pero profesional.\n7. El resultado debe ser UN SOLO bloque de texto coherente.\n8. Si el usuario envía basura, intenta darle sentido solidario pero NUNCA respondas como chat.",
        temperature: 0.4,
        topP: 0.8,
      },
    });

    let polishedText = response.text?.trim() || story;
    polishedText = polishedText.replace(/^(Aquí tienes|Esta es|He mejorado|Versión mejorada).*:(\n)?/i, "");

    return res.status(200).json({ text: polishedText });

  } catch (error: any) {
    logger.error('AI_POLISH_ERROR', error);
    
    if (error.message.includes('Demasiadas solicitudes')) {
       return res.status(429).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error processing content on the server' });
  }
}
