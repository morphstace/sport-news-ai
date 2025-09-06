import type { Schema } from '../../data/resource';
import { GoogleGenAI } from '@google/genai';
import { env } from '$amplify/env/correct-text-function';

const API_KEY = env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: API_KEY });

export const handler: Schema['correctText']['functionHandler'] = async (event) => {
  try {
    const text = event.arguments.text;
    
    const prompt = `
Correggi questo testo in italiano mantenendo il significato originale.
Correggi solo errori grammaticali, di ortografia e di punteggiatura.
Non modificare il contenuto o il tono del testo.

Testo da correggere:
${text}

Restituisci solo il testo corretto senza spiegazioni aggiuntive.
`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });

    const response = await result.text;
    if (!response) {
      throw new Error('Nessuna risposta ricevuta dal modello di correzione del testo');
    }
    return response.trim();
  } catch (error) {
    console.error('Errore nella correzione del testo:', error);
    throw error;
  }
};