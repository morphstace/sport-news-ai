import { Button, Flex, Heading, Text } from '@aws-amplify/ui-react';

export default function Navbar({ user, isAdmin, userProfile, onLoginClick, onSignOut, onNavigate, currentPage }) {
  // Logica migliorata per determinare il nome da mostrare
  const displayName = () => {
    // Prima priorità: nome completo dal profilo
    if (userProfile?.name && userProfile.name !== 'Utente') {
      return userProfile.name;
    }
    
    // Seconda priorità: nome + cognome dal profilo
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`.trim();
    }
    
    // Terza priorità: solo nome dal profilo
    if (userProfile?.firstName) {
      return userProfile.firstName;
    }
    
    // Quarta priorità: email dal profilo (solo la parte prima di @)
    if (userProfile?.email && userProfile.email.includes('@')) {
      return userProfile.email.split('@')[0];
    }
    
    // Fallback: se tutto il resto fallisce
    if (user?.username) {
      // Se l'username è un UUID, usa solo "Utente"
      if (user.username.includes('-') && user.username.length > 20) {
        return 'Utente';
      }
      return user.username;
    }
    
    return 'Utente';
  };

  // DEBUG: Log temporaneo (rimuovi dopo aver risolto)
  console.log('Navbar - userProfile:', userProfile);
  console.log('Navbar - displayName result:', displayName());

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
      {/* Logo/Brand */}
      <Flex alignItems="center" gap="1rem">
        <img
          src='/logo.png'
          alt="Sport News AI Logo"
          style={{ width: 40, height: 40, borderRadius: '8px', cursor: 'pointer' }}
          onClick={() => onNavigate('home')}
        />
        <Heading 
          level={3} 
          margin="0"
          color="#ffc107"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('home')}
        >
          Sport News AI
        </Heading>
      </Flex>

      {/* Navigation Links */}
      {user && (
        <Flex gap="1rem" alignItems="center">
          <Button
            variation="link"
            onClick={() => onNavigate('profile')}
            color={currentPage === 'profile' ? '#ffc107' : '#fff'}
            fontWeight={currentPage === 'profile' ? '600' : '400'}
          >
            Profile
          </Button>
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
          {isAdmin && (
            <Button
              variation="link"
              onClick={() => onNavigate('admin')}
              color={currentPage === 'admin' ? '#ffc107' : '#dc3545'}
              fontWeight={currentPage === 'admin' ? '600' : '400'}
            >
              🛠️ Admin
            </Button>
          )}
        </Flex>
      )}

      {/* User Section */}
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