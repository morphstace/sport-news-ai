import { generateClient } from 'aws-amplify/data';

const client = generateClient();

export const correctText = async (text) => {
  try {
    const response = await client.queries.correctText({ text });
    return response.data;
  } catch (error) {
    console.error('Errore nella correzione del testo:', error);
    throw error;
  }
};

export const generateTags = async (title, content) => {
  try {
    const response = await client.queries.generateTags({ title, content });
    return response.data;
  } catch (error) {
    console.error('Errore nella generazione dei tag:', error);
    throw error;
  }
};

export const summarizeText = async (text) => {
  try {
    const response = await client.queries.summarizeText({ text });
    return response.data;
  } catch (error) {
    console.error('Errore nel riassunto del testo:', error);
    throw error;
  }
};