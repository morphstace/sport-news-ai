import { Button, Heading, Flex, Text } from '@aws-amplify/ui-react';

export default function HomePage({ onLoginClick }) {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      padding="4rem"
      gap="2rem"
    >
      <Heading level={1}>Welcome to Sport News AI</Heading>
      <Text fontSize="large" textAlign="center" maxWidth="600px">
        Discover the latest sports news powered by AI. 
        Get personalized updates and insights from your favorite sports.
      </Text>
      
      <Flex gap="1rem">
        <Button variation="primary" onClick={onLoginClick}>
          Sign In
        </Button>
        <Button variation="link">
          Learn More
        </Button>
      </Flex>
      
      {/* Contenuto pubblico aggiuntivo */}
      <Flex direction="column" gap="1rem" marginTop="2rem">
        <Heading level={3}>Latest Public News</Heading>
        <Text>• Breaking: Championship finals scheduled</Text>
        <Text>• Transfer window updates</Text>
        <Text>• Season highlights and statistics</Text>
      </Flex>
    </Flex>
  );
}