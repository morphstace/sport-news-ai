import type { Schema } from '../../data/resource';
import { GoogleGenAI } from '@google/genai';
import { env } from '$amplify/env/gemini-function';

const API_KEY = env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: API_KEY });

export const correctTextHandler: Schema['correctText']['functionHandler'] = async (event) => {
  try {
    return await correctText(event.arguments.text);
  } catch (error) {
    console.error('Errore nella correzione del testo:', error);
    throw error;
  }
};

export const generateTagsHandler: Schema['generateTags']['functionHandler'] = async (event) => {
  try {
    return await generateTags(event.arguments.title, event.arguments.content);
  } catch (error) {
    console.error('Errore nella generazione dei tag:', error);
    throw error;
  }
};

export const summarizeTextHandler: Schema['summarizeText']['functionHandler'] = async (event) => {
  try {
    return await summarizeText(event.arguments.text);
  } catch (error) {
    console.error('Errore nel riassunto del testo:', error);
    throw error;
  }
};

// Funzioni di utilità
const correctText = async (text: string): Promise<string> => {
  try {
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

const generateTags = async (title: string, content: string): Promise<string> => {
  try {
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

const summarizeText = async (text: string): Promise<string> => {
  try {
    const prompt = `
Riassumi questo testo sportivo in italiano mantenendo i punti chiave.
Il riassunto deve essere conciso, chiaro e coinvolgente.
Massimo 1000 caratteri, minimo 500 caratteri.

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