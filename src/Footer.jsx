import { Flex, Text, View, Link } from '@aws-amplify/ui-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <Flex
      direction="column"
      alignItems="center"
      padding="1.5rem 2rem"
      backgroundColor="#f8f9fa"
      borderTop="1px solid #e1e8ed"
      marginTop="auto"
      gap="0.75rem"
    >
      {/* Prima riga: Copyright */}
      <Text
        fontSize="0.9rem"
        color="#6c757d"
        fontWeight="400"
        textAlign="center"
      >
        © {currentYear} Alfredo Camposano. Tutti i diritti riservati.
      </Text>
      
      {/* Seconda riga: Links */}
      <Flex
        justifyContent="center"
        alignItems="center"
        gap="1rem"
        wrap="wrap"
      >
        <Text
          fontSize="0.8rem"
          color="#9ca3af"
        >
          Powered by AWS Amplify
        </Text>
        
        <Link
          href="https://github.com/morphstace/sport-news-ai" // Sostituisci con il tuo URL
          target="_blank"
          rel="noopener noreferrer"
          fontSize="0.8rem"
          color="#0366d6"
          textDecoration="none"
          display="flex"
          alignItems="center"
          gap="0.25rem"
          style={{
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.color = '#0256cc';
            e.target.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#0366d6';
            e.target.style.textDecoration = 'none';
          }}
        >
          <img 
            src="/public/github-mark.svg"
            alt="GitHub" 
            style={{ width: '16px', height: '16px' }} 
          />
        </Link>
      </Flex>
    </Flex>
  );
}