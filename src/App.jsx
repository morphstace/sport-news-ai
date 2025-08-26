import { useEffect, useState } from 'react'
import { 
  Button,
  Heading,
  Flex,
  View,
  Grid,
  Divider,
  Authenticator
} from '@aws-amplify/ui-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {Amplify} from 'aws-amplify';
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from 'aws-amplify/data';
import outputs from "../amplify_outputs.json";
import HomePage from './HomePage';
import PostEditor from './PostEditor';
import PostList from './PostList';
import Navbar from './Navbar';

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

function AuthenticatedApp({signOut, user}) {
  const [userprofiles, setUserProfiles] = useState([]);
  const [currentPage, setCurrentPage] = useState('profile'); // Cambia default in 'home'

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
   const { data: profiles } = await client.models.UserProfile.list();
   setUserProfiles(profiles);
  }

  // Funzione per gestire la navigazione
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  return (
    <Flex direction="column" minHeight="100vh">
      {/* Navbar sempre presente */}
      <Navbar 
        user={user}
        onSignOut={signOut}
        onNavigate={handleNavigation}
        currentPage={currentPage}
        onLoginClick={() => {}} // Non necessario per utenti autenticati
      />

      {/* Contenuto principale */}
      <Flex flex="1">
        {/* AGGIUNGI QUESTA CONDIZIONE PER LA HOME */}
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

            <Divider />
            
            {/* Quick Actions */}
            <Flex gap="1rem" margin="1rem 0">
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
            </Flex>
            
            <Divider />
            
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
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  
  // Se vogliamo mostrare il login
  if (showLogin) {
    return (
      <Authenticator
        signUpAttributes={[
          'email',
          'given_name',    // Nome
          'family_name'    // Cognome
        ]}
        formFields={{
          signUp: {
            given_name: {
              label: 'Nome *',
              placeholder: 'Inserisci il tuo nome',
              isRequired: true,
              order: 1
            },
            family_name: {
              label: 'Cognome *',
              placeholder: 'Inserisci il tuo cognome', 
              isRequired: true,
              order: 2
            },
            email: {
              label: 'Email *',
              placeholder: 'Inserisci la tua email',
              isRequired: true,
              order: 3
            },
            password: {
              label: 'Password *',
              placeholder: 'Inserisci una password sicura',
              isRequired: true,
              order: 4
            },
            confirm_password: {
              label: 'Conferma Password *',
              placeholder: 'Conferma la password',
              isRequired: true,
              order: 5
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

  // Homepage pubblica con navbar
  return (
    <Flex direction="column" minHeight="100vh">
      <Navbar 
        user={null}
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