import type { Schema } from '../../data/resource';
import { GoogleGenAI } from '@google/genai';
import { env } from '$amplify/env/generate-tags-function';

const API_KEY = env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: API_KEY });

export const handler: Schema['generateTags']['functionHandler'] = async (event) => {
  try {
    const { title, content } = event.arguments;
    
    const prompt = `
Analizza questo articolo sportivo e genera tag pertinenti in italiano.
Concentrati su sport, squadre, giocatori, competizioni e categorie menzionate.
Restituisci massimo 8 tag separati da virgole.

Titolo: ${title}

Contenuto: ${content}

Restituisci solo i tag separati da virgole, senza spiegazioni aggiuntive.
`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });
    
    const response = await result.text;
    if (!response) {
      throw new Error('Nessuna risposta ricevuta dal modello di generazione dei tag');
    }
    return response.trim();
  } catch (error) {
    console.error('Errore nella generazione dei tag:', error);
    throw error;
  }
};