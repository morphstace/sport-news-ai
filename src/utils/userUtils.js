import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export async function deleteUser(userId) {
  try {
    // Usando la mutation generata automaticamente da Amplify
    const result = await client.models.UserProfile.delete({
      id: userId
    });
    
    return result;
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'utente:', error);
    throw error;
  }
}