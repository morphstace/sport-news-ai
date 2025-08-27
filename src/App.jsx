import { useEffect, useState } from 'react'
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
  const [userAttributes, setUserAttributes] = useState(null);

  useEffect(() => {
    initializeUserData();
  }, [user]);

  async function initializeUserData() {
    try {
      await fetchUserProfile();
      const attributes = await getUserAttributes();
      await checkAndCreateUserProfile(attributes);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing user data:', error);
      setLoading(false);
    }
  }

  async function fetchUserProfile() {
    try {
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  }

  async function getUserAttributes() {
    try {
      const attributes = await fetchUserAttributes();
      setUserAttributes(attributes);
      return attributes;
    } catch (error) {
      console.error('Error fetching user attributes:', error);
      return null;
    }
  }

  async function checkAndCreateUserProfile(attributes = null) {
    const currentAttributes = attributes || userAttributes;
    
    if (!currentAttributes?.email && !user?.username) {
      console.error('No user email found');
      return;
    }

    const userEmail = currentAttributes?.email || user?.username || '';
    const userId = user?.userId || user?.username || currentAttributes?.sub || '';
    
    let existingProfile = userprofiles.find(profile => profile.email === userEmail);

    // Se il profilo non esiste, crealo
    if (!existingProfile) {
      try {
        const givenName = currentAttributes?.given_name || '';
        const familyName = currentAttributes?.family_name || '';
        const fullName = `${givenName} ${familyName}`.trim();

        const newProfileData = {
          email: userEmail,
          name: fullName || 'Utente',
          firstName: givenName,
          lastName: familyName,
          role: 'user',
          profileOwner: userId
        };

        const response = await client.models.UserProfile.create(newProfileData);
        
        // Ricarica i profili
        await fetchUserProfile();
        existingProfile = response.data;
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    }

    if (existingProfile) {
      setCurrentUserProfile(existingProfile);
      setUserRole(existingProfile.role || 'user');
    }
  }

  // Funzione per aggiornare il ruolo di un utente (solo admin)
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
      
      await fetchUserProfile();
      
      // Se stiamo aggiornando il nostro profilo, aggiorna anche il ruolo locale
      if (currentUserProfile && currentUserProfile.id === profileId) {
        setUserRole(newRole);
        setCurrentUserProfile(prev => ({ ...prev, role: newRole }));
      }
      
      alert(`Ruolo aggiornato a ${newRole === 'admin' ? 'Amministratore' : 'Utente'}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Errore durante l\'aggiornamento del ruolo');
    }
  }

  // Funzione per gestire la navigazione
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="100vh">
        <Heading level={3}>Caricamento profilo...</Heading>
      </Flex>
    );
  }

  return (
    <Flex direction="column" minHeight="100vh">
      {/* Navbar sempre presente */}
      <Navbar 
        user={user}
        userRole={userRole}
        onSignOut={signOut}
        onNavigate={handleNavigation}
        currentPage={currentPage}
        onLoginClick={() => {}}
      />

      {/* Contenuto principale */}
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
            onEditPost={(post) => {
              setCurrentPage('create');
            }}
            signOut={signOut}
          />
        )}

        {/* Pannello Admin (solo per admin) */}
        {currentPage === 'admin' && userRole === 'admin' && (
          <AdminPanel
            userProfiles={userprofiles}
            currentUserRole={userRole}
            onUpdateRole={updateUserRole}
            onRefresh={fetchUserProfile}
          />
        )}

        {currentPage === 'profile' && (
          <Flex
            className='App'
            justifyContent='center'
            alignItems="center"
            direction= "column"
            width="70%"
            margin="0 auto"
            padding="2rem"
          >
            <Heading level={1}>My Profile</Heading>
            
            {/* Mostra ruolo corrente */}
            <Alert 
              variation={userRole === 'admin' ? 'success' : 'info'} 
              margin="1rem 0"
              hasIcon={true}
            >
              <strong>Ruolo:</strong> {userRole === 'admin' ? '🛡️ Amministratore' : '👤 Utente'}
            </Alert>

            <Divider />
            
            {/* Quick Actions */}
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
              {/* Pulsante Admin Panel solo per admin */}
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
            
            {/* Profilo utente corrente */}
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
                <View>
                  <strong>Nome:</strong> {currentUserProfile.firstName || 'N/A'}
                </View>
                <View>
                  <strong>Cognome:</strong> {currentUserProfile.lastName || 'N/A'}
                </View>
                <View>
                  <strong>Ruolo:</strong> {currentUserProfile.role === 'admin' ? 'Amministratore' : 'Utente'}
                </View>
              </Flex>
            ) : (
              // Fallback: mostra tutti i profili come prima (per compatibilità)
              <Grid
                margin="3rem 0"
                autoFlow="column"
                justifyContent="center"
                gap="2rem"
                alignContent="center"
              >
                {userprofiles.map((userprofile) => (
                  <Flex
                    key={userprofile.id || userprofile.email}
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    gap="2rem"
                    border="1px solid #ccc"
                    padding="2rem"
                    borderRadius="5%"
                    className="box"
                  >
                    <View>
                      <Heading level="3">{userprofile.name}</Heading>
                    </View>
                  </Flex>
                ))}
              </Grid>
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
        signUpAttributes={[
          'email',
          'given_name',
          'family_name'
        ]}
        formFields={{
          signUp: {
            given_name: {
              label: 'Nome *',
              placeholder: 'Inserisci il tuo nome',
              isRequired: true,
              order: 1,
              inputProps: {
                autoComplete: 'given-name'
              }
            },
            family_name: {
              label: 'Cognome *',
              placeholder: 'Inserisci il tuo cognome', 
              isRequired: true,
              order: 2,
              inputProps: {
                autoComplete: 'family-name'
              }
            },
            email: {
              label: 'Email *',
              placeholder: 'Inserisci la tua email',
              isRequired: true,
              order: 3,
              inputProps: {
                autoComplete: 'email'
              }
            },
            password: {
              label: 'Password *',
              placeholder: 'Inserisci una password sicura',
              isRequired: true,
              order: 4,
              inputProps: {
                autoComplete: 'new-password'
              }
            },
            confirm_password: {
              label: 'Conferma Password *',
              placeholder: 'Conferma la password',
              isRequired: true,
              order: 5,
              inputProps: {
                autoComplete: 'new-password'
              }
            }
          }
        }}
      >
        {({ signOut, user }) => {
          return user ? (
            <AuthenticatedApp signOut={signOut} user={user} />
          ) : (
            <div>Loading login form...</div>
          );
        }}
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
        onNavigate={(page) => {
          if (page === 'home') {
            // Già sulla home
          }
        }}
        currentPage="home"
      />
      <Flex flex="1">
        <HomePage onLoginClick={() => setShowLogin(true)} />
      </Flex>
    </Flex>
  );
}