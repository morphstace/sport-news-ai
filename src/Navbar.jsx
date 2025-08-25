import { Button, Flex, Heading, Text } from '@aws-amplify/ui-react';

export default function Navbar({ user, onLoginClick, onSignOut, onNavigate, currentPage }) {
  return (
    <Flex
      as="nav"
      padding="1rem 2rem"
      backgroundColor="var(--amplify-colors-background-secondary)"
      borderBottom="1px solid var(--amplify-colors-border-primary)"
      justifyContent="space-between"
      alignItems="center"
      position="sticky"
      top="0"
      zIndex="100"
    >
      {/* Logo/Brand */}
      <Flex alignItems="center" gap="1rem">
        <Heading 
          level={3} 
          margin="0"
          color="var(--amplify-colors-brand-primary-80)"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('home')}
        >
          🏆 Sport News AI
        </Heading>
      </Flex>

      {/* Navigation Links - Solo per utenti autenticati */}
      {user && (
        <Flex gap="1rem" alignItems="center">
          <Button
            variation={currentPage === 'profile' ? 'primary' : 'link'}
            onClick={() => onNavigate('profile')}
          >
            Profile
          </Button>
          <Button
            variation={currentPage === 'posts' ? 'primary' : 'link'}
            onClick={() => onNavigate('posts')}
          >
            My Posts
          </Button>
          <Button
            variation={currentPage === 'create' ? 'primary' : 'link'}
            onClick={() => onNavigate('create')}
          >
            Create Post
          </Button>
        </Flex>
      )}

      {/* User Section */}
      <Flex alignItems="center" gap="1rem">
        {user ? (
          <>
            <Text fontSize="small" color="var(--amplify-colors-font-secondary)">
              Welcome, {user.username}
            </Text>
            <Button variation="outline" onClick={onSignOut}>
              Sign Out
            </Button>
          </>
        ) : (
          <Button variation="primary" onClick={onLoginClick}>
            Sign In
          </Button>
        )}
      </Flex>
    </Flex>
  );
}