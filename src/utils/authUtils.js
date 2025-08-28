import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export const checkIfUserIsAdmin = async () => {
  try {
    // Metodo 1: Prova con fetchAuthSession (più affidabile)
    const session = await fetchAuthSession();
    console.log('Session:', session);
    
    if (session.tokens?.accessToken) {
      const payload = session.tokens.accessToken.payload;
      console.log('Access token payload:', payload);
      const groups = payload['cognito:groups'] || [];
      console.log('Groups from session:', groups);
      return groups.includes('admins');
    }
    
    // Metodo 2: Fallback con getCurrentUser
    const user = await getCurrentUser();
    console.log('User from getCurrentUser:', user);
    
    if (user.signInUserSession?.accessToken) {
      const groups = user.signInUserSession.accessToken.payload['cognito:groups'] || [];
      console.log('Groups from user session:', groups);
      return groups.includes('admins');
    }
    
    console.log('No valid session found');
    return false;
    
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const getUserGroups = async () => {
  try {
    const session = await fetchAuthSession();
    if (session.tokens?.accessToken) {
      return session.tokens.accessToken.payload['cognito:groups'] || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
};