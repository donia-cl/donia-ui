
import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  // Configuración de CORS para permitir peticiones desde el frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // Manejo de preflight request
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

    // De acuerdo a las directrices: obtener la API Key exclusivamente de process.env.API_KEY
    // e inicializar directamente en el constructor.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Usamos el modelo gemini-3-flash-preview para tareas de texto
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Mejora y humaniza este texto para una campaña solidaria en Chile: "${story}"`,
      config: {
        systemInstruction: "Eres un redactor experto en causas sociales en Chile. Tu tarea es mejorar el storytelling de campañas de crowdfunding. El texto debe sonar profesional, honesto, emotivo y humano. Usa un lenguaje cercano pero respetuoso, típico de Chile.",
        temperature: 0.7,
      },
    });

    // Accedemos a la propiedad .text directamente como indica la documentación
    return res.status(200).json({ text: response.text });

  } catch (error: any) {
    console.error("Gemini API Server Error:", error);
    return res.status(500).json({ error: 'Error processing content on the server' });
  }
}
