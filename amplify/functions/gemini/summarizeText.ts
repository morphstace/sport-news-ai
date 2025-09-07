import type { Schema } from '../../data/resource';
import { GoogleGenAI } from '@google/genai';
import { env } from '$amplify/env/summarize-text-function';

const API_KEY = env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: API_KEY });

export const handler: Schema['summarizeText']['functionHandler'] = async (event) => {
  try {
    const text = event.arguments.text;
    
    const prompt = `
Riassumi questo testo sportivo in italiano mantenendo i punti chiave.
Il riassunto deve essere conciso, chiaro e coinvolgente.
Il riassunto deve avere una lunghezza compresa tra 500 e 1000 caratteri.

Testo da riassumere:
${text}

Restituisci solo il riassunto senza spiegazioni aggiuntive.
`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });
    
    const response = await result.text;
    if (!response) {
      throw new Error('Nessuna risposta ricevuta dal modello di riassunto del testo');
    }
    return response.trim();
  } catch (error) {
    console.error('Errore nel riassunto del testo:', error);
    throw error;
  }
};