import { Button, Flex, Text } from '@aws-amplify/ui-react';
import { Link } from 'react-router-dom';

export default function Navbar({ user, isAdmin, userProfile, onLoginClick, onSignOut, onNavigate, currentPage, onAppNameClick }) {
  const displayName = () => {
    if (userProfile?.name && userProfile.name !== 'Utente') {
      return userProfile.name;
    }
    
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`.trim();
    }
    
    if (userProfile?.firstName) {
      return userProfile.firstName;
    }
    
    if (userProfile?.email && userProfile.email.includes('@')) {
      return userProfile.email.split('@')[0];
    }
    
    if (user?.username) {
      if (user.username.includes('-') && user.username.length > 20) {
        return 'Utente';
      }
      return user.username;
    }
    
    return 'Utente';
  };

  return (
    <Flex
      as="nav"
      padding="1rem 2rem"
      backgroundColor="#343a40"
      borderBottom="1px solid #495057"
      justifyContent="space-between"
      alignItems="center"
      position="sticky"
      top="0"
      zIndex="100"
      boxShadow="0 2px 8px rgba(0,0,0,0.2)"
    >
      <Flex alignItems="center" gap="1rem">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="navbar-logo">
            <img src="/logo.png" alt="Logo" style={{ height: '32px', verticalAlign: 'middle' }} />
            <span
              className="app-name"
              style={{ cursor: 'pointer' }}
              onClick={onAppNameClick}
            >
              Sport News AI
            </span>
          </div>
        </Link>
      </Flex>

      {/* Sezione centrale con i link di navigazione */}
      <Flex gap="1rem" alignItems="center">
        {/* Link Articoli - visibile sempre */}
        <Button
          variation="link"
          onClick={() => onNavigate('articles')}
          color={currentPage === 'articles' ? '#ffc107' : '#fff'}
          fontWeight={currentPage === 'articles' ? '600' : '400'}
        >
          📰 Articoli
        </Button>

        {/* Link per utenti autenticati */}
        {user && (
          <>
            <Button
              variation="link"
              onClick={() => onNavigate('profile')}
              color={currentPage === 'profile' ? '#ffc107' : '#fff'}
              fontWeight={currentPage === 'profile' ? '600' : '400'}
            >
              Profile
            </Button>
            
            {/* Solo gli admin possono vedere le opzioni di gestione post */}
            {isAdmin && (
              <>
                <Button
                  variation="link"
                  onClick={() => onNavigate('posts')}
                  color={currentPage === 'posts' ? '#ffc107' : '#fff'}
                  fontWeight={currentPage === 'posts' ? '600' : '400'}
                >
                  My Posts
                </Button>
                <Button
                  variation="link"
                  onClick={() => onNavigate('create')}
                  color={currentPage === 'create' ? '#ffc107' : '#fff'}
                  fontWeight={currentPage === 'create' ? '600' : '400'}
                >
                  Create Post
                </Button>
                <Button
                  variation="link"
                  onClick={() => onNavigate('admin')}
                  color={currentPage === 'admin' ? '#ffc107' : '#dc3545'}
                  fontWeight={currentPage === 'admin' ? '600' : '400'}
                >
                  🛠️ Admin
                </Button>
              </>
            )}
          </>
        )}
      </Flex>

      <Flex alignItems="center" gap="1rem">
        {user ? (
          <>
            <Flex direction="column" alignItems="flex-end">
              <Text 
                fontSize="small" 
                color="#adb5bd"
                fontWeight="500"
              >
                Welcome, {displayName()}
              </Text>
              {isAdmin && (
                <Text 
                  fontSize="x-small" 
                  color="#28a745"
                  fontWeight="400"
                >
                  🛡️ Admin
                </Text>
              )}
            </Flex>
            <Button 
              variation="outline" 
              onClick={onSignOut}
              borderColor="#dc3545"
              color="#dc3545"
              backgroundColor="transparent"
            >
              Sign Out
            </Button>
          </>
        ) : (
          <Button 
            variation="primary" 
            onClick={onLoginClick}
            backgroundColor="#ffc107"
            color="#000"
            fontWeight="600"
          >
            Sign In
          </Button>
        )}
      </Flex>
    </Flex>
  );
}