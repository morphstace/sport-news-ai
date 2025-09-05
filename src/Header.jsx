import { Flex, Image, View } from '@aws-amplify/ui-react';

export default function Header({ onClick }) {
  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      padding="1rem 2rem"
      backgroundColor="white"
      borderBottom="1px solid #e1e8ed"
      position="sticky"
      top="0"
      zIndex="1000"
      boxShadow="0 2px 4px rgba(0,0,0,0.1)"
    >
      <View
        as="div"
        onClick={onClick}
        style={{
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <Image
          src="/public/header.png" // Sostituisci con il path della tua immagine
          alt="Sport News AI - Titolo"
          width="auto"
          height="60px"
          objectFit="contain"
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </View>
    </Flex>
  );
}