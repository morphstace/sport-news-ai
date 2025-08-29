import { useState, useEffect } from 'react';
import { 
  Heading,
  Flex,
  View,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Badge,
  Alert,
  Divider,
  Card,
  Button
} from '@aws-amplify/ui-react';
import { checkIfUserIsAdmin } from './utils/authUtils';

export default function AdminPanel({ userProfiles, isAdmin, onRefresh }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const adminStatus = await checkIfUserIsAdmin();
      setLoading(false);
    };
    verifyAdmin();
  }, []);

  if (loading) return <div>Loading...</div>;
  
  if (!isAdmin) {
    return (
      <Flex 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh" 
        direction="column"
        padding="2rem"
      >
        <Alert variation="error" hasIcon={true}>
          <strong>Accesso Negato</strong><br />
          Solo gli amministratori possono accedere a questa sezione.
        </Alert>
      </Flex>
    );
  }

  const adminCount = userProfiles.filter(p => p.role === 'admin').length;
  const userCount = userProfiles.filter(p => p.role === 'user' || !p.role).length;

  return (
    <Flex
      direction="column"
      padding="2rem"
      width="95%"
      margin="0 auto"
    >
      <Heading level={1} color="#343a40">🛠️ Pannello Amministratore</Heading>
      
      <Alert variation="info" margin="1rem 0" hasIcon={true}>
        <strong>Benvenuto nel pannello di amministrazione!</strong><br />
        Da qui puoi gestire i ruoli degli utenti registrati. Solo gli amministratori possono promuovere o declassare altri utenti.
      </Alert>

      <Flex gap="1rem" margin="1rem 0" wrap="wrap">
        <Card padding="1rem" flex="1" minWidth="200px">
          <Heading level={4} margin="0 0 0.5rem 0" color="#28a745">👥 Utenti Totali</Heading>
          <Heading level={2} margin="0" color="#343a40">{userProfiles.length}</Heading>
        </Card>
        <Card padding="1rem" flex="1" minWidth="200px">
          <Heading level={4} margin="0 0 0.5rem 0" color="#007bff">🛡️ Amministratori</Heading>
          <Heading level={2} margin="0" color="#343a40">{adminCount}</Heading>
        </Card>
        <Card padding="1rem" flex="1" minWidth="200px">
          <Heading level={4} margin="0 0 0.5rem 0" color="#6c757d">👤 Utenti Normali</Heading>
          <Heading level={2} margin="0" color="#343a40">{userCount}</Heading>
        </Card>
      </Flex>

      <Divider margin="1rem 0" />

      <Flex justifyContent="space-between" alignItems="center" margin="1rem 0">
        <Heading level={3}>Gestione Utenti</Heading>
        <Button variation="outline" onClick={onRefresh}>
          🔄 Aggiorna Lista
        </Button>
      </Flex>

      {userProfiles.length === 0 ? (
        <Alert variation="warning" hasIcon={true}>
          <strong>Nessun utente trovato</strong><br />
          Non ci sono utenti registrati nel database.
        </Alert>
      ) : (
        <Card>
          <Table
            highlightOnHover={true}
            size="small"
          >
            <TableHead>
              <TableRow>
                <TableCell as="th" style={{ fontWeight: 'bold' }}>Nome</TableCell>
                <TableCell as="th" style={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell as="th" style={{ fontWeight: 'bold' }}>Ruolo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <Flex direction="column">
                      <View fontWeight="500">{profile.name || 'N/A'}</View>
                      {profile.firstName && profile.lastName && (
                        <View fontSize="0.85em" color="gray">
                          {profile.firstName} {profile.lastName}
                        </View>
                      )}
                    </Flex>
                  </TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variation={profile.role === 'admin' ? 'success' : 'info'}
                    >
                      {profile.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Divider margin="2rem 0" />

      <Alert variation="warning" hasIcon={true}>
        <strong>⚠️ Nota:</strong><br />
        La gestione dei ruoli è ora basata sui gruppi Cognito e deve essere gestita dalla console AWS.
      </Alert>
    </Flex>
  );
}