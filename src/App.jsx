import { useEffect, useState, useRef } from 'react'
import { 
  Button,
  Heading,
  Flex,
  View,
  Grid,
  Divider,
  Authenticator,
  Alert
} from '@aws-amplify/ui-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {Amplify} from 'aws-amplify';
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'; // AGGIUNGI fetchAuthSession
import { checkIfUserIsAdmin } from './utils/authUtils'; // AGGIUNGI QUESTO IMPORT
import outputs from "../amplify_outputs.json";
import HomePage from './HomePage';
import PostEditor from './PostEditor';
import PostList from './PostList';
import Navbar from './Navbar';
import AdminPanel from './AdminPanel';

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

function AuthenticatedApp({signOut, user}) {
  const [userprofiles, setUserProfiles] = useState([]);
  const [currentPage, setCurrentPage] = useState('profile');
  const [isAdmin, setIsAdmin] = useState(false); // CAMBIA da userRole a isAdmin
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!initializingRef.current) {
      initializeUserData();
    }
  }, [user]);

  async function initializeUserData() {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      // 1. Ottieni attributi utente
      const attributes = await fetchUserAttributes();
      
      // 2. Controlla se è admin usando i gruppi Cognito
      const adminStatus = await checkIfUserIsAdmin();
      setIsAdmin(adminStatus);
      
      // 3. Carica profili esistenti
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
      
      // 4. Controlla/crea profilo utente
      await ensureUserProfile(attributes, profiles);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing user data:', error);
      setLoading(false);
    }
  }

  async function ensureUserProfile(attributes, existingProfiles) {
    if (!attributes?.email && !user?.username) {
      console.error('No user email found');
      return;
    }

    const userEmail = attributes?.email || user?.username || '';
    const userId = user?.userId || user?.username || attributes?.sub || '';
    
    let userProfile = existingProfiles.find(profile => profile.email === userEmail);
    
    if (!userProfile) {
      try {
        const givenName = attributes?.given_name || '';
        const familyName = attributes?.family_name || '';
        const fullName = `${givenName} ${familyName}`.trim();

        const response = await client.models.UserProfile.create({
          email: userEmail,
          name: fullName || 'Utente',
          firstName: givenName,
          lastName: familyName,
          // RIMUOVI: role: 'user', - non esiste più nel schema
          profileOwner: userId
        });
        
        userProfile = response.data;
        setUserProfiles(prev => [...prev, userProfile]);
      } catch (error) {
        console.error('Error creating user profile:', error);
        return;
      }
    }

    setCurrentUserProfile(userProfile);
  }

  async function refreshUserProfiles() {
    try {
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
      
      if (currentUserProfile) {
        const updatedProfile = profiles.find(p => p.id === currentUserProfile.id);
        if (updatedProfile) {
          setCurrentUserProfile(updatedProfile);
        }
      }
      
      // Ricontrolla lo status admin
      const adminStatus = await checkIfUserIsAdmin();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error refreshing user profiles:', error);
    }
  }

  // RIMUOVI questa funzione - i ruoli ora si gestiscono tramite gruppi Cognito
  // async function updateUserRole(profileId, newRole) { ... }

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="100vh">
        <Heading level={3}>Caricamento profilo...</Heading>
      </Flex>
    );
  }

  // Aggiungi questa funzione di debug
  async function debugUserGroups() {
    try {
      console.log('=== DEBUG USER GROUPS ===');
      
      // Metodo 1: fetchAuthSession
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      console.log('Access token:', session.tokens?.accessToken);
      console.log('Access token payload:', session.tokens?.accessToken?.payload);
      console.log('Groups from session:', session.tokens?.accessToken?.payload?.['cognito:groups']);
      
      // Metodo 2: getCurrentUser
      const user = await getCurrentUser();
      console.log('Current user:', user);
      console.log('User session:', user.signInUserSession);
      
      // Metodo 3: checkIfUserIsAdmin
      const isAdmin = await checkIfUserIsAdmin();
      console.log('Is admin result:', isAdmin);
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  }

  return (
    <Flex direction="column" minHeight="100vh">
      {/* BOTTONE TEMPORANEO PER DEBUG */}
      <Button onClick={debugUserGroups} size="small">
        Debug Groups
      </Button>
      
      <Navbar 
        user={user}
        isAdmin={isAdmin} // CAMBIA da userRole a isAdmin
        userProfile={currentUserProfile}
        onSignOut={signOut}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onLoginClick={() => {}}
      />

      <Flex flex="1">
        {currentPage === 'home' && (
          <HomePage onLoginClick={() => {}} />
        )}

        {currentPage === 'create' && (
          <PostEditor
            onBack={() => setCurrentPage('posts')}
            signOut={signOut}
            editingPost={null}
          />
        )}

        {currentPage === 'posts' && (
          <PostList
            onBack={() => setCurrentPage('profile')}
            onCreateNew={() => setCurrentPage('create')}
            onEditPost={() => setCurrentPage('create')}
            signOut={signOut}
          />
        )}

        {currentPage === 'admin' && isAdmin && (
          <AdminPanel
            userProfiles={userprofiles}
            isAdmin={isAdmin} // CAMBIA da currentUserRole a isAdmin
            onRefresh={refreshUserProfiles}
          />
        )}

        {currentPage === 'profile' && (
          <Flex
            className='App'
            justifyContent='center'
            alignItems="center"
            direction="column"
            width="70%"
            margin="0 auto"
            padding="2rem"
          >
            <Heading level={1}>My Profile</Heading>
            
            <Alert 
              variation={isAdmin ? 'success' : 'info'} // USA isAdmin
              margin="1rem 0"
              hasIcon={true}
            >
              <strong>Ruolo:</strong> {isAdmin ? '🛡️ Amministratore' : '👤 Utente'}
            </Alert>

            <Divider />
            
            <Flex gap="1rem" margin="1rem 0" wrap="wrap" justifyContent="center">
              <Button
                variation='primary'
                onClick={() => setCurrentPage('create')}
              >
                Create New Post
              </Button>
              <Button
                variation="outline"
                onClick={() => setCurrentPage('posts')}
              >
                Manage Posts
              </Button>
              {isAdmin && ( // USA isAdmin
                <Button
                  variation="destructive"
                  onClick={() => setCurrentPage('admin')}
                >
                  🛠️ Admin Panel
                </Button>
              )}
            </Flex>
            
            <Divider />
            
            {currentUserProfile ? (
              <Flex
                direction="column"
                justifyContent="center"
                alignItems="center"
                gap="1rem"
                border="1px solid #ccc"
                padding="2rem"
                borderRadius="8px"
                margin="2rem 0"
                className="box"
                backgroundColor="var(--amplify-colors-background-secondary)"
              >
                <Heading level="3">{currentUserProfile.name}</Heading>
                <View><strong>Email:</strong> {currentUserProfile.email}</View>
                <View><strong>Nome:</strong> {currentUserProfile.firstName || 'N/A'}</View>
                <View><strong>Cognome:</strong> {currentUserProfile.lastName || 'N/A'}</View>
                <View><strong>Ruolo:</strong> {isAdmin ? 'Amministratore' : 'Utente'}</View>
              </Flex>
            ) : (
              <Alert variation="warning">
                Profilo non trovato. Prova a ricaricare la pagina.
              </Alert>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  
  if (showLogin) {
    return (
      <Authenticator
        signUpAttributes={['email', 'given_name', 'family_name']}
        formFields={{
          signUp: {
            given_name: {
              label: 'Nome *',
              placeholder: 'Inserisci il tuo nome',
              isRequired: true,
              order: 1,
              inputProps: { autoComplete: 'given-name' }
            },
            family_name: {
              label: 'Cognome *',
              placeholder: 'Inserisci il tuo cognome', 
              isRequired: true,
              order: 2,
              inputProps: { autoComplete: 'family-name' }
            },
            email: {
              label: 'Email *',
              placeholder: 'Inserisci la tua email',
              isRequired: true,
              order: 3,
              inputProps: { autoComplete: 'email' }
            },
            password: {
              label: 'Password *',
              placeholder: 'Inserisci una password sicura',
              isRequired: true,
              order: 4,
              inputProps: { autoComplete: 'new-password' }
            },
            confirm_password: {
              label: 'Conferma Password *',
              placeholder: 'Conferma la password',
              isRequired: true,
              order: 5,
              inputProps: { autoComplete: 'new-password' }
            }
          }
        }}
      >
        {({ signOut, user }) => (
          user ? <AuthenticatedApp signOut={signOut} user={user} /> : <div>Loading...</div>
        )}
      </Authenticator>
    );
  }

  return (
    <Flex direction="column" minHeight="100vh">
      <Navbar 
        user={null}
        userRole="guest"
        onLoginClick={() => setShowLogin(true)}
        onSignOut={() => {}}
        onNavigate={() => {}}
        currentPage="home"
      />
      <Flex flex="1">
        <HomePage onLoginClick={() => setShowLogin(true)} />
      </Flex>
    </Flex>
  );
}