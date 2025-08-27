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
import { fetchUserAttributes } from 'aws-amplify/auth';
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
  const [userRole, setUserRole] = useState('user');
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Ref per prevenire inizializzazioni multiple
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
      
      // 2. Carica profili esistenti
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
      
      // 3. Controlla/crea profilo utente
      await ensureUserProfile(attributes, profiles);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing user data:', error);
      setLoading(false);
    }
  }

  // FUNZIONE CONSOLIDATA: gestisce sia il controllo che la creazione
  async function ensureUserProfile(attributes, existingProfiles) {
    if (!attributes?.email && !user?.username) {
      console.error('No user email found');
      return;
    }

    const userEmail = attributes?.email || user?.username || '';
    const userId = user?.userId || user?.username || attributes?.sub || '';
    
    // Cerca profilo esistente
    let userProfile = existingProfiles.find(profile => profile.email === userEmail);
    
    // Se non esiste, crealo
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
          role: 'user',
          profileOwner: userId
        });
        
        userProfile = response.data;
        
        // Aggiorna lo stato locale senza ricaricare tutto
        setUserProfiles(prev => [...prev, userProfile]);
      } catch (error) {
        console.error('Error creating user profile:', error);
        return;
      }
    }

    // Imposta profilo corrente e ruolo
    setCurrentUserProfile(userProfile);
    setUserRole(userProfile.role || 'user');
  }

  // FUNZIONE CONSOLIDATA: ricarica profili (solo quando necessario)
  async function refreshUserProfiles() {
    try {
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
      
      // Aggiorna anche il profilo corrente se necessario
      if (currentUserProfile) {
        const updatedProfile = profiles.find(p => p.id === currentUserProfile.id);
        if (updatedProfile) {
          setCurrentUserProfile(updatedProfile);
          setUserRole(updatedProfile.role || 'user');
        }
      }
    } catch (error) {
      console.error('Error refreshing user profiles:', error);
    }
  }

  // Funzione per aggiornare il ruolo (semplificata)
  async function updateUserRole(profileId, newRole) {
    if (userRole !== 'admin') {
      alert('Solo gli amministratori possono modificare i ruoli');
      return;
    }

    try {
      await client.models.UserProfile.update({
        id: profileId,
        role: newRole
      });
      
      // Aggiorna lo stato locale
      setUserProfiles(prev => 
        prev.map(profile => 
          profile.id === profileId 
            ? { ...profile, role: newRole }
            : profile
        )
      );
      
      // Se è il nostro profilo, aggiorna anche il ruolo locale
      if (currentUserProfile?.id === profileId) {
        setUserRole(newRole);
        setCurrentUserProfile(prev => ({ ...prev, role: newRole }));
      }
      
      alert(`Ruolo aggiornato a ${newRole === 'admin' ? 'Amministratore' : 'Utente'}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Errore durante l\'aggiornamento del ruolo');
    }
  }

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="100vh">
        <Heading level={3}>Caricamento profilo...</Heading>
      </Flex>
    );
  }

  return (
    <Flex direction="column" minHeight="100vh">
      <Navbar 
        user={user}
        userRole={userRole}
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

        {currentPage === 'admin' && userRole === 'admin' && (
          <AdminPanel
            userProfiles={userprofiles}
            currentUserRole={userRole}
            onUpdateRole={updateUserRole}
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
              variation={userRole === 'admin' ? 'success' : 'info'} 
              margin="1rem 0"
              hasIcon={true}
            >
              <strong>Ruolo:</strong> {userRole === 'admin' ? '🛡️ Amministratore' : '👤 Utente'}
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
              {userRole === 'admin' && (
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
                <View><strong>Ruolo:</strong> {currentUserProfile.role === 'admin' ? 'Amministratore' : 'Utente'}</View>
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