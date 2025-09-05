import { useEffect, useState, useRef, useCallback } from 'react'
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
import './App.css'; // Importa il CSS personalizzato
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
import ProfilePage from './Profile'; // Import del nuovo componente
import Header from './Header'; // Import del nuovo Header
import Footer from './Footer'; // Import del nuovo Footer
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const initializingRef = useRef(false);

  // Funzione per gestire gli errori
  const handleError = useCallback((error, context) => {
    console.error(`Error in ${context}:`, error);
    setError(`Errore in ${context}: ${error.message || error}`);
    setLoading(false);
  }, []);

  // Funzione per inizializzare i dati utente ottimizzata
  const initializeUserData = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      setError(null);
      setLoading(true);
      
      const [attributes, adminStatus] = await Promise.all([
        fetchUserAttributes(),
        checkIfUserIsAdmin()
      ]);
      
      setIsAdmin(adminStatus);
      
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
      
      await ensureUserProfile(attributes, profiles);
      
    } catch (error) {
      handleError(error, 'initialization');
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  useEffect(() => {
    if (user && !initializingRef.current) {
      initializeUserData();
    }
  }, [user, initializeUserData]);

  const ensureUserProfile = useCallback(async (attributes, existingProfiles) => {
    if (!attributes?.email && !user?.username) {
      throw new Error('No user email or username found');
    }

    const userEmail = attributes?.email || user?.username || '';
    const userId = user?.userId || user?.username || attributes?.sub || '';
    
    let userProfile = existingProfiles.find(profile => 
      profile.email === userEmail || profile.profileOwner === userId
    );
    
    if (!userProfile) {
      const givenName = attributes?.given_name || '';
      const familyName = attributes?.family_name || '';
      const fullName = `${givenName} ${familyName}`.trim();

      const userProfileData = {
        email: userEmail,
        name: fullName || 'Utente',
        firstName: givenName || null,
        lastName: familyName || null,
        profileOwner: userId
      };

      const response = await client.models.UserProfile.create(userProfileData);
      userProfile = response.data;
      setUserProfiles(prev => [...prev, userProfile]);
    }

    setCurrentUserProfile(userProfile);
  }, [user]);

  const refreshUserProfiles = useCallback(async () => {
    try {
      const [profilesResult, adminStatus] = await Promise.all([
        client.models.UserProfile.list(),
        checkIfUserIsAdmin()
      ]);
      
      setUserProfiles(profilesResult.data);
      setIsAdmin(adminStatus);
      
      if (currentUserProfile) {
        const updatedProfile = profilesResult.data.find(p => p.id === currentUserProfile.id);
        if (updatedProfile) {
          setCurrentUserProfile(updatedProfile);
        }
      }
    } catch (error) {
      handleError(error, 'refreshing user profiles');
    }
  }, [currentUserProfile, handleError]);

  // Handlers ottimizzati
  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setCurrentPage('create');
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditingPost(null);
    setCurrentPage('create');
  }, []);

  const handleBackFromEditor = useCallback(() => {
    setEditingPost(null);
    setCurrentPage('posts');
  }, []);

  const handleNavigate = useCallback((page) => {
    if (page === 'articles') {
      navigate('/articles');
    } else if (page === 'home') {
      navigate('/');
      setCurrentPage('home');
    } else {
      // Per tutte le altre pagine, naviga verso la home e imposta il currentPage
      navigate('/');
      setCurrentPage(page);
      setError(null);
    }
  }, [navigate]);

  // Aggiorna currentPage basato sull'URL quando cambia la location
  useEffect(() => {
    if (location.pathname === '/articles') {
      setCurrentPage('articles');
    } else if (location.pathname.startsWith('/post/')) {
      // Mantieni il currentPage esistente quando visualizzi un post
      // In questo modo la navbar mostrerà ancora la pagina da cui provieni
    } else if (location.pathname === '/') {
      // Solo se currentPage non è già impostato o è 'articles'
      if (currentPage === 'articles' || !currentPage) {
        setCurrentPage('profile');
      }
    }
  }, [location.pathname, currentPage]);

  // Loading state
  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="100vh">
        <Heading level={3}>Caricamento profilo...</Heading>
      </Flex>
    );
  }

  // Error state
  if (error) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="100vh" direction="column" gap="1rem">
        <Alert variation="error">
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()}>
          Ricarica Pagina
        </Button>
      </Flex>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Background pattern */}
      <div className="app-background"></div>
      
      <Flex direction="column" minHeight="100vh">
        {/* Header con immagine titolo */}
        <Header onClick={() => handleNavigate('home')} />
        
        <Navbar 
          user={user}
          isAdmin={isAdmin}
          userProfile={currentUserProfile}
          onSignOut={signOut}
          onNavigate={handleNavigate}
          currentPage={location.pathname === '/articles' ? 'articles' : currentPage}
          onLoginClick={() => {}}
          onAppNameClick={() => handleNavigate('home')}
        />

        <Flex flex="1">
          <Routes>
            <Route path="/" element={
              <PageRenderer 
                currentPage={currentPage}
                isAdmin={isAdmin}
                currentUserProfile={currentUserProfile}
                userprofiles={userprofiles}
                editingPost={editingPost}
                onEditPost={handleEditPost}
                onCreateNew={handleCreateNew}
                onBackFromEditor={handleBackFromEditor}
                onNavigate={handleNavigate}
                refreshUserProfiles={refreshUserProfiles}
                signOut={signOut}
              />
            } />
            <Route path="/post/:postId" element={<PostPage />} />
            <Route path="/articles" element={<PostBrowser onBack={() => handleNavigate('home')} />} />
          </Routes>
        </Flex>

        {/* Footer */}
        <Footer />
      </Flex>
    </div>
  );
}

// Componente separato per il rendering delle pagine
function PageRenderer({ 
  currentPage, 
  isAdmin, 
  currentUserProfile, 
  userprofiles, 
  editingPost,
  onEditPost,
  onCreateNew,
  onBackFromEditor,
  onNavigate,
  refreshUserProfiles,
  signOut
}) {
  switch (currentPage) {
    case 'home':
      return <HomePage onLoginClick={() => {}} />;
    
    case 'articles':
      return <PostBrowser onBack={() => onNavigate('home')} />;
    
    case 'create':
      if (!isAdmin) return <AccessDenied onBack={() => onNavigate('profile')} />;
      return (
        <PostEditor
          onBack={onBackFromEditor}
          signOut={signOut}
          editingPost={editingPost}
        />
      );
    
    case 'posts':
      if (!isAdmin) return <AccessDenied onBack={() => onNavigate('profile')} />;
      return (
        <PostList
          onBack={() => onNavigate('profile')}
          onCreateNew={onCreateNew}
          onEditPost={onEditPost}
          signOut={signOut}
        />
      );
    
    case 'admin':
      if (!isAdmin) return <AccessDenied onBack={() => onNavigate('profile')} />;
      return (
        <AdminPanel
          userProfiles={userprofiles}
          isAdmin={isAdmin}
          onRefresh={refreshUserProfiles}
        />
      );
    
    default:
      return <ProfilePage isAdmin={isAdmin} currentUserProfile={currentUserProfile} onNavigate={onNavigate} />;
  }
}

// Componente per l'accesso negato
function AccessDenied({ onBack }) {
  return (
    <Flex justifyContent="center" alignItems="center" minHeight="50vh" direction="column" gap="1rem">
      <Alert variation="error" hasIcon>
        <strong>Accesso Negato</strong><br />
        Non hai i permessi per accedere a questa sezione.
      </Alert>
      <Button onClick={onBack}>Torna al Profilo</Button>
    </Flex>
  );
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleShowLogin = useCallback(() => setShowLogin(true), []);

  const handleNavigateGuest = useCallback((page) => {
    if (page === 'articles') {
      navigate('/articles');
    } else if (page === 'home') {
      navigate('/');
    }
  }, [navigate]);

  const handleSignOut = useCallback((signOutFunction) => {
    signOutFunction();
    setShowLogin(false);
    navigate('/');
  }, [navigate]);

  if (showLogin) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <div className="app-background"></div>
        
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
            user ? (
              <AuthenticatedApp 
                signOut={() => handleSignOut(signOut)} 
                user={user} 
              />
            ) : (
              <Flex direction="column" minHeight="100vh">
                <div>Loading...</div>
                <Footer />
              </Flex>
            )
          )}
        </Authenticator>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="app-background"></div>
      
      <Flex direction="column" minHeight="100vh">
        {/* Header con immagine titolo anche per i guest */}
        <Header onClick={() => navigate('/')} />
        
        <Navbar 
          user={null}
          userRole="guest"
          onLoginClick={handleShowLogin}
          onSignOut={() => {}}
          onNavigate={handleNavigateGuest}
          currentPage={location.pathname === '/articles' ? 'articles' : 'home'}
        />
        
        <Flex flex="1">
          <Routes>
            <Route path="/" element={<HomePage onLoginClick={handleShowLogin} />} />
            <Route path="/articles" element={<PostBrowser onBack={() => navigate('/')} />} />
            <Route path="/post/:postId" element={<PostPage />} />
          </Routes>
        </Flex>

        {/* Footer per gli utenti guest */}
        <Footer />
      </Flex>
    </div>
  );
}