import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('API Key loaded:', API_KEY ? 'Yes' : 'No'); // Debug

if (!API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY non è definita. Controlla il file .env");
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Funzioni per correzione e miglioramento testo
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

    // Prova con questa sintassi per @google/genai
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

export const improveText = async (text, type = 'article') => {
  try {
    const prompts = {
      article: `
Migliora questo articolo sportivo mantenendo tutti i fatti e le informazioni originali.
Rendi il testo più coinvolgente e professionale per un pubblico sportivo italiano.
Mantieni lo stesso tono e lunghezza approssimativa.

Articolo da migliorare:
${text}

Restituisci solo l'articolo migliorato senza spiegazioni aggiuntive.
`,
      title: `
Migliora questo titolo di articolo sportivo rendendolo più accattivante e clickbait.
Mantieni il significato originale ma rendilo più interessante per i lettori.
Massimo 10-12 parole.

Titolo da migliorare:
${text}

Restituisci solo il titolo migliorato senza spiegazioni aggiuntive.
`
    };

    const prompt = prompts[type] || prompts.article;
    
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });
    
    return response.text.trim();
  } catch (error) {
    console.error('Errore nel miglioramento del testo:', error);
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