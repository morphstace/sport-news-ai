import { Button, Flex, Text } from '@aws-amplify/ui-react';

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
      backgroundColor="#73818fff"
      borderBottom="1px solid #495057"
      justifyContent="space-between"
      alignItems="center"
      position="sticky"
      top="0"
      zIndex="100"
      boxShadow="0 2px 8px rgba(0,0,0,0.2)"
    >
      <Flex alignItems="center" gap="1rem">
        <div 
          className="navbar-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('home')}
        >
          <img src="/logo.png" alt="Logo" style={{ height: '32px', verticalAlign: 'middle' }} />
          <span className="navbar-title" style={{ color: '#012967ff', fontWeight: '600', marginLeft: '0.5rem', fontSize: '1.25rem' }} onClick={onAppNameClick}>
            Home
          </span>
        </div>
      </Flex>

      {/* Sezione centrale con i link di navigazione */}
      <Flex gap="1rem" alignItems="center">
        {/* Link Articoli - visibile sempre */}
        <Button
          variation="link"
          onClick={() => onNavigate('articles')}
          color={currentPage === 'articles' ? '#012967ff' : '#fff'}
          fontWeight={currentPage === 'articles' ? '600' : '400'}
        >
          📰 Articoli
        </Button>

        {/* Link per utenti autenticati */}
        {user && (
          <>
            {/* Solo gli admin possono vedere le opzioni di gestione post */}
            {isAdmin && (
              <>
                <Button
                  variation="link"
                  onClick={() => onNavigate('posts')}
                  color={currentPage === 'posts' ? '#012967ff' : '#fff'}
                  fontWeight={currentPage === 'posts' ? '600' : '400'}
                >
                  I miei Posts
                </Button>
                <Button
                  variation="link"
                  onClick={() => onNavigate('create')}
                  color={currentPage === 'create' ? '#012967ff' : '#fff'}
                  fontWeight={currentPage === 'create' ? '600' : '400'}
                >
                  Crea Post
                </Button>
                <Button
                  variation="link"
                  onClick={() => onNavigate('admin')}
                  color={currentPage === 'admin' ? '#012967ff' : '#dc3545'}
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
                color="#012967ff"
                fontWeight="500"
              >
                Benvenuto, {displayName()}
              </Text>
            </Flex>
            <Button 
              variation="outline" 
              onClick={onSignOut}
              borderColor="#dc3545"
              color="#dc3545"
              backgroundColor="transparent"
            >
              Esci
            </Button>
          </>
        ) : (
          <Button 
            variation="primary" 
            onClick={onLoginClick}
            backgroundColor="#00693bff"
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