
import { GoogleGenAI } from "@google/genai";
import { Validator, logger, checkRateLimit } from './_utils.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ip = req.headers['x-forwarded-for'] || 'unknown';
    checkRateLimit(String(ip), 5, 60000);

    const { story } = req.body;
    Validator.required(story, 'story');
    Validator.string(story, 10, 'story');

    if (!process.env.API_KEY) throw new Error('AI API Key not configured');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    logger.info('AI_POLISH_REQUEST', { ip, storyLength: story.length });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transforma el siguiente borrador en una historia de campaña de recaudación única, potente y conmovedora. 

TEXTO DEL USUARIO:
"${story}"`,
      config: {
        systemInstruction: "ERES UN PROCESADOR DE TEXTO ESTATICO. TU UNICA FUNCION ES REESCRIBIR EL TEXTO DEL USUARIO. \n\nREGLAS CRITICAS:\n1. NO des opciones.\n2. NO des consejos.\n3. NO hables con el usuario.\n4. SOLO entrega el texto final.\n5. Tono chileno: cercano, emotivo pero profesional.",
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
