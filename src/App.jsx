import { useEffect, useState, useRef } from 'react'
import { 
  Button,
  Heading,
  Flex,
  View,
  Divider,
  Authenticator,
  Alert
} from '@aws-amplify/ui-react';
import {Amplify} from 'aws-amplify';
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { checkIfUserIsAdmin } from './utils/authUtils';
import outputs from "../amplify_outputs.json";
import HomePage from './HomePage';
import PostEditor from './PostEditor';
import PostList from './PostList';
import PostBrowser from './PostBrowser';
import Navbar from './Navbar';
import AdminPanel from './AdminPanel';
import { Routes, Route, useLocation } from 'react-router-dom';
import PostPage from './PostPage.jsx';

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

function AuthenticatedApp({signOut, user}) {
  const [userprofiles, setUserProfiles] = useState([]);
  const [currentPage, setCurrentPage] = useState('profile');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const location = useLocation();
  
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
      const attributes = await fetchUserAttributes();
      const adminStatus = await checkIfUserIsAdmin();
      setIsAdmin(adminStatus);
      
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
      
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

        const userProfileData = {
          email: userEmail,
          name: fullName || 'Utente',
          firstName: givenName,
          lastName: familyName,
          profileOwner: userId
        };

        const response = await client.models.UserProfile.create(userProfileData);
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
      
      const adminStatus = await checkIfUserIsAdmin();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error refreshing user profiles:', error);
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post);
    setCurrentPage('create');
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setCurrentPage('create');
  };

  const handleBackFromEditor = () => {
    setEditingPost(null);
    setCurrentPage('posts');
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
      <Navbar 
        user={user}
        isAdmin={isAdmin}
        userProfile={currentUserProfile}
        onSignOut={signOut}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onLoginClick={() => {}}
        onAppNameClick={() => setCurrentPage('home')}
      />

      <Flex flex="1">
        <Routes>
          <Route path="/" element={
            currentPage === 'home' ? (
              <HomePage onLoginClick={() => {}} />
            ) : currentPage === 'articles' ? (
              <PostBrowser onBack={() => setCurrentPage('home')} />
            ) : currentPage === 'create' && isAdmin ? (
              <PostEditor
                onBack={handleBackFromEditor}
                signOut={signOut}
                editingPost={editingPost}
              />
            ) : currentPage === 'posts' && isAdmin ? (
              <PostList
                onBack={() => setCurrentPage('profile')}
                onCreateNew={handleCreateNew}
                onEditPost={handleEditPost}
                signOut={signOut}
              />
            ) : currentPage === 'admin' && isAdmin ? (
              <AdminPanel
                userProfiles={userprofiles}
                isAdmin={isAdmin}
                onRefresh={refreshUserProfiles}
              />
            ) : (
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
                  variation={isAdmin ? 'success' : 'info'}
                  margin="1rem 0"
                  hasIcon={true}
                >
                  <strong>Ruolo:</strong> {isAdmin ? '🛡️ Amministratore' : '👤 Utente'}
                </Alert>

                <Divider />
                
                {/* Solo gli admin vedono i pulsanti di gestione post */}
                {isAdmin ? (
                  <Flex gap="1rem" margin="1rem 0" wrap="wrap" justifyContent="center">
                    <Button
                      variation='primary'
                      onClick={handleCreateNew}
                    >
                      Create New Post
                    </Button>
                    <Button
                      variation="outline"
                      onClick={() => setCurrentPage('posts')}
                    >
                      Manage Posts
                    </Button>
                    <Button
                      variation="destructive"
                      onClick={() => setCurrentPage('admin')}
                    >
                      🛠️ Admin Panel
                    </Button>
                  </Flex>
                ) : (
                  <Alert variation="info" margin="1rem 0">
                    <strong>Benvenuto!</strong><br />
                    Come utente puoi leggere tutti i post pubblicati. Solo gli amministratori possono creare e modificare contenuti.
                  </Alert>
                )}
                
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
            )
          } />
          <Route path="/post/:postId" element={<PostPage />} />
        </Routes>
      </Flex>
    </Flex>
  );
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  
  // Determina se siamo su una pagina di post
  const isPostPage = location.pathname.startsWith('/post/');
  
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
      {!isPostPage && (
        <Navbar 
          user={null}
          userRole="guest"
          onLoginClick={() => setShowLogin(true)}
          onSignOut={() => {}}
          onNavigate={(page) => {
            if (page === 'articles') {
              // Per gli utenti non autenticati, mostra solo la sezione articoli
              window.location.href = '#articles';
            }
          }}
          currentPage="home"
        />
      )}
      <Flex flex="1">
        <Routes>
          <Route path="/" element={<HomePage onLoginClick={() => setShowLogin(true)} />} />
          <Route path="/post/:postId" element={<PostPage />} />
        </Routes>
      </Flex>
    </Flex>
  );
}