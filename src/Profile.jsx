import React from 'react';
import {
  Button,
  Heading,
  Flex,
  View,
  Alert
} from '@aws-amplify/ui-react';

// Componente principale per la pagina profilo
function ProfilePage({ isAdmin, currentUserProfile, onNavigate }) {
  return (
    <Flex
      className='App'
      justifyContent='center'
      alignItems="center"
      direction="column"
      width="90%"
      maxWidth="800px"
      margin="0 auto"
      padding="2rem"
      gap="2rem"
    >
      <Flex 
        direction="column" 
        alignItems="center"
        padding="2rem"
        borderRadius="12px"
        backgroundColor="white"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
        width="100%"
      >
        <Heading level={1} color="var(--amplify-colors-neutral-60)">
          Il Mio Profilo
        </Heading>
        
        <Alert 
          variation={isAdmin ? 'success' : 'info'}
          margin="1rem 0"
          hasIcon={true}
          borderRadius="8px"
          width="100%"
          textAlign="center"
        >
          <View as="strong" color="var(--amplify-colors-neutral-60)">Ruolo:</View> 
          <span style={{ color: 'var(--amplify-colors-neutral-60)' }}>
            {isAdmin ? '🛡️ Amministratore' : '👤 Utente'}
          </span>
        </Alert>

        {currentUserProfile ? (
          <ProfileInfo profile={currentUserProfile} isAdmin={isAdmin} />
        ) : (
          <Alert variation="warning" borderRadius="8px" width="100%">
            <span style={{ color: 'var(--amplify-colors-neutral-60)' }}>
              Profilo non trovato. Prova a ricaricare la pagina.
            </span>
          </Alert>
        )}
      </Flex>
      
      <Flex 
        direction="column"
        padding="2rem"
        borderRadius="12px"
        backgroundColor="white"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
        width="100%"
        gap="1rem"
      >
        {isAdmin ? (
          <AdminActions onNavigate={onNavigate} />
        ) : (
          <UserWelcome />
        )}
      </Flex>
    </Flex>
  );
}

// Componente per le azioni admin
function AdminActions({ onNavigate }) {
  return (
    <>
      <Heading level={3} textAlign="center" color="var(--amplify-colors-neutral-60)" margin="0 0 1rem 0">
        Pannello Amministratore
      </Heading>
      <Flex gap="1rem" wrap="wrap" justifyContent="center">
        <Button 
          variation='primary' 
          onClick={() => onNavigate('create')}
          size="large"
          borderRadius="8px"
          padding="1rem 2rem"
        >
          📝 Crea Nuovo Post
        </Button>
        <Button 
          variation="outline" 
          onClick={() => onNavigate('posts')}
          size="large"
          borderRadius="8px"
          padding="1rem 2rem"
        >
          📋 Gestisci Post
        </Button>
        <Button 
          variation="destructive" 
          onClick={() => onNavigate('admin')}
          size="large"
          borderRadius="8px"
          padding="1rem 2rem"
        >
          🛠️ Pannello Admin
        </Button>
      </Flex>
    </>
  );
}

// Componente per il messaggio di benvenuto utente
function UserWelcome() {
  return (
    <>
      <Heading level={3} textAlign="center" color="var(--amplify-colors-neutral-60)" margin="0 0 1rem 0">
        Benvenuto nella Community
      </Heading>
      <Alert 
        variation="info" 
        borderRadius="8px"
        backgroundColor="var(--amplify-colors-blue-10)"
        border="1px solid var(--amplify-colors-blue-40)"
      >
        <Flex direction="column" gap="0.5rem">
          <View as="strong" color="var(--amplify-colors-neutral-60)">🎉 Ciao e benvenuto!</View>
          <View color="var(--amplify-colors-neutral-60)">
            Come membro della nostra community puoi leggere tutti i post pubblicati sui tuoi sport preferiti. 
            Resta aggiornato con le ultime notizie e analisi sportive!
          </View>
        </Flex>
      </Alert>
    </>
  );
}

// Componente per le informazioni del profilo
function ProfileInfo({ profile, isAdmin }) {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      gap="1.5rem"
      padding="2rem"
      borderRadius="12px"
      margin="1rem 0"
      backgroundColor="var(--amplify-colors-neutral-10)"
      border="2px solid var(--amplify-colors-brand-primary-20)"
      width="100%"
      maxWidth="500px"
    >
      <Flex 
        justifyContent="center" 
        alignItems="center" 
        width="80px" 
        height="80px" 
        borderRadius="50%" 
        backgroundColor="var(--amplify-colors-brand-primary-10)"
        border="3px solid var(--amplify-colors-brand-primary)"
      >
      </Flex>
      
      <Heading level="3" color="var(--amplify-colors-neutral-60)" textAlign="center">
        {profile.name}
      </Heading>
      
      <Flex direction="column" gap="1rem" width="100%" alignItems="center">
        <ProfileField label="Email" value={profile.email} icon="📧" />
        <ProfileField label="Nome" value={profile.firstName || 'N/A'} icon="👤" />
        <ProfileField label="Cognome" value={profile.lastName || 'N/A'} icon="👤" />
        <ProfileField 
          label="Ruolo"
          value={isAdmin ? 'Amministratore' : 'Utente'} 
          icon={isAdmin ? '🛡️' : '👥'} 
          highlight={isAdmin}
        />
      </Flex>
    </Flex>
  );
}

// Componente helper per i campi del profilo
function ProfileField({ label, value, icon, highlight = false }) {
  return (
    <Flex 
      justifyContent="space-between" 
      alignItems="center" 
      width="100%" 
      padding="0.75rem 1rem"
      borderRadius="8px"
      backgroundColor={highlight ? "var(--amplify-colors-green-10)" : "white"}
      border={highlight ? "1px solid var(--amplify-colors-green-40)" : "1px solid var(--amplify-colors-neutral-20)"}
    >
      <Flex alignItems="center" gap="0.5rem">
        <span>{icon}</span>
        <View 
          as="strong" 
          color="var(--amplify-colors-neutral-60)"
        >
          {label}:
        </View>
      </Flex>
      <View 
        color={highlight ? "var(--amplify-colors-green-80)" : "var(--amplify-colors-neutral-60)"}
        fontWeight={highlight ? "bold" : "normal"}
      >
        {value}
      </View>
    </Flex>
  );
}

export default ProfilePage;