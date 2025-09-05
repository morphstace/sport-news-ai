import { GoogleGenAI } from "@google/genai";
import {secret} from '@aws-amplify/backend';

const API_KEY = secret('GEMINI_API_KEY');

console.log('API Key loaded:', API_KEY ? 'Yes' : 'No'); // Debug

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY non è definita. Controlla il file .env");
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

export const correctText = async (text) => {
  try {
    const prompt = `
Correggi questo testo in italiano mantenendo il significato originale.
Correggi solo errori grammaticali, di ortografia e di punteggiatura.
Non modificare il contenuto o il tono del testo.

Testo da correggere:
${text}

Restituisci solo il testo corretto senza spiegazioni aggiuntive.
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });
    
    return response.text.trim();
  } catch (error) {
    console.error('Errore nella correzione del testo:', error);
    throw error;
  }
};

export const generateTags = async (title, content) => {
  try {
    const prompt = `
Analizza questo articolo sportivo e genera tag pertinenti in italiano.
Concentrati su sport, squadre, giocatori, competizioni e categorie menzionate.
Restituisci massimo 8 tag separati da virgole.

Titolo: ${title}

Contenuto: ${content}

Restituisci solo i tag separati da virgole, senza spiegazioni aggiuntive.
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });
    
    return response.text.trim();
  } catch (error) {
    console.error('Errore nella generazione dei tag:', error);
    throw error;
  }
};

export const summarizeText = async (text) => {
  try {
    const prompt = `
Riassumi questo testo sportivo in italiano mantenendo i punti chiave.
Il riassunto deve essere conciso, chiaro e coinvolgente.
Massimo 1000 caratteri, minimo 500 caratteri.

Testo da riassumere:
${text}

Restituisci solo il riassunto senza spiegazioni aggiuntive.
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });
    
    return response.text.trim();
  } catch (error) {
    console.error('Errore nel riassunto del testo:', error);
    throw error;
  }
};