
import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  // Configuración de CORS
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
    const { story } = req.body;
    
    if (!story) {
        return res.status(400).json({ error: 'Story content is required' });
    }

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'AI API Key not configured on server' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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

    // Se extrae el texto puro y se limpia cualquier residuo de formato markdown de headers si el modelo insistiera
    let polishedText = response.text?.trim() || story;
    
    // Limpieza adicional por si el modelo incluye "Aquí tienes la versión mejorada" o similar
    polishedText = polishedText.replace(/^(Aquí tienes|Esta es|He mejorado|Versión mejorada).*:(\n)?/i, "");

    return res.status(200).json({ text: polishedText });

  } catch (error: any) {
    console.error("Gemini API Server Error:", error);
    return res.status(500).json({ error: 'Error processing content on the server' });
  }
}
