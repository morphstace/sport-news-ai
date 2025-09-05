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
  Button,
  useTheme,
  Text
} from '@aws-amplify/ui-react';
import { getCurrentUser } from 'aws-amplify/auth';
import { checkIfUserIsAdmin } from './utils/authUtils';
import { deleteUser } from './utils/userUtils';

export default function AdminPanel({ userProfiles, onRefresh }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { tokens } = useTheme();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const adminStatus = await checkIfUserIsAdmin();
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
          const user = await getCurrentUser();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Errore verifica admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    verifyAdmin();
  }, []);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (user) => {
    if (!user) return;

    // Conferma con dialog nativo del browser
    const confirmDelete = window.confirm(
      `Sei sicuro di voler eliminare l'utente ${user.name || user.email}?\n\n` +
      `⚠️ ATTENZIONE: Questa azione è irreversibile. Tutti i dati dell'utente verranno eliminati permanentemente.`
    );

    if (!confirmDelete) {
      return;
    }

    setDeletingUserId(user.id);
    try {
      await deleteUser(user.id);
      onRefresh(); // Ricarica la lista utenti
      alert('Utente eliminato con successo!');
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error);
      alert('Errore durante l\'eliminazione dell\'utente. Riprova.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="60vh">
        <Heading level={3}>Verifica permessi amministratore...</Heading>
      </Flex>
    );
  }
  
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
          Devi appartenere al gruppo "admins" di Cognito.
        </Alert>
      </Flex>
    );
  }

  const totalUsers = userProfiles.length;

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
        Da qui puoi visualizzare e gestire gli utenti registrati. I ruoli amministratore sono gestiti tramite gruppi AWS Cognito.
      </Alert>

      <Flex gap="1rem" margin="1rem 0" wrap="wrap">
        <Card padding="1rem" flex="1" minWidth="200px">
          <Heading level={4} margin="0 0 0.5rem 0" color="#28a745">👥 Utenti Totali</Heading>
          <Heading level={2} margin="0" color="#343a40">{totalUsers}</Heading>
        </Card>
        <Card padding="1rem" flex="1" minWidth="200px">
          <Heading level={4} margin="0 0 0.5rem 0" color="#007bff">📊 Database</Heading>
          <Heading level={2} margin="0" color="#343a40">UserProfile</Heading>
        </Card>
      </Flex>

      <Divider margin="1rem 0" />

      <Flex justifyContent="space-between" alignItems="center" margin="1rem 0">
        <Heading level={3}>Lista Utenti</Heading>
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
                <TableCell as="th" style={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell as="th" style={{ fontWeight: 'bold' }}>Data Registrazione</TableCell>
                <TableCell as="th" style={{ fontWeight: 'bold' }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userProfiles.map((profile) => {
                const isCurrentUser = currentUser && profile.email === currentUser.signInDetails?.loginId;
                
                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <Flex direction="column">
                        <View fontWeight="500">
                          {profile.name || 'N/A'}
                          {isCurrentUser && (
                            <Badge variation="success" marginLeft="0.5rem" fontSize="0.7em">
                              Tu
                            </Badge>
                          )}
                        </View>
                        {profile.firstName && profile.lastName && (
                          <View fontSize="0.85em" color="gray">
                            {profile.firstName} {profile.lastName}
                          </View>
                        )}
                      </Flex>
                    </TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Badge variation="info">
                        👤 Utente Registrato
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <View fontSize="0.85em" color="gray">
                        {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                      </View>
                    </TableCell>
                    <TableCell>
                      {isCurrentUser ? (
                        <Badge variation="outline">
                          Non eliminabile
                        </Badge>
                      ) : (
                        <Button
                          variation="destructive"
                          size="small"
                          onClick={() => handleDeleteConfirm(profile)}
                          isLoading={deletingUserId === profile.id}
                          loadingText="Eliminando..."
                          disabled={deletingUserId !== null}
                        >
                          🗑️ Elimina
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Divider margin="2rem 0" />

      <Alert variation="warning" hasIcon={true}>
        <strong>⚠️ Nota sui Ruoli:</strong><br />
        I ruoli amministratore sono gestiti esclusivamente tramite gruppi AWS Cognito (gruppo "admins"), 
        non tramite il database UserProfile. Per gestire i permessi admin, usa la console AWS Cognito User Pools.
      </Alert>
    </Flex>
  );
}