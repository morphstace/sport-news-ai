import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { checkIfUserIsAdmin } from './utils/authUtils';
import S3Image from './components/S3Image'; // Aggiungi questa importazione
import {
    View,
    Text,
    Button,
    Flex,
    Card,
    Heading,
    Divider,
    Badge,
    Alert
} from '@aws-amplify/ui-react';

const client = generateClient({ authMode: "userPool" });

export default function PostList({ onBack, onCreateNew, onEditPost, signOut }) {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const initialize = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
                
                // Verifica se è admin (puoi personalizzare questa logica)
                setIsAdmin(false); // o la tua logica per verificare admin
                
                await fetchPosts();
            } catch (error) {
                console.error('Error initializing:', error);
                setError('Errore durante l\'inizializzazione');
            }
        };

        initialize();
    }, []);

    useEffect(() => {
        const checkAdmin = async () => {
            const adminStatus = await checkIfUserIsAdmin();
            if (!adminStatus) {
                onBack(); // Torna indietro se non è admin
            }
        };
        checkAdmin();
    }, []);

    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            const { data: posts } = await client.models.Post.list({
                authMode: 'userPool'
            });
            
            // Ordina i post per data di pubblicazione (più recenti prima)
            const sortedPosts = posts.sort((a, b) => 
                new Date(b.publishedAt) - new Date(a.publishedAt)
            );
            
            setPosts(sortedPosts);
            setError('');
        } catch (error) {
            console.error('Error fetching posts:', error);
            setError('Errore durante il caricamento dei post');
        } finally {
            setIsLoading(false);
        }
    };

    const deletePost = async (postId) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo post?')) {
            return;
        }

        try {
            await client.models.Post.delete({ id: postId });
            setPosts(posts.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Errore durante l\'eliminazione del post');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const truncateContent = (content, maxLength = 150) => {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    let content;
    
    if (isLoading) {
        content = (
            <View textAlign="center" padding="2rem">
                <Text>Caricamento post...</Text>
            </View>
        );
    } else if (error) {
        content = (
            <Alert variation="error" isDismissible={false}>
                {error}
                <Button onClick={fetchPosts} size="small" marginTop="1rem">
                    Riprova
                </Button>
            </Alert>
        );
    } else if (posts.length === 0) {
        content = (
            <View textAlign="center" padding="3rem">
                <Heading level={3}>Nessun post trovato</Heading>
                <Text>Non ci sono ancora post pubblicati.</Text>
                <Button 
                    onClick={onCreateNew}
                    variation="primary" 
                    marginTop="1rem"
                >
                    Crea il primo post
                </Button>
            </View>
        );
    } else {
        content = (
            <View>
                {posts.map((post) => (
                    <Card key={post.id} marginBottom="1.5rem" padding="1.5rem">
                        <Flex direction="column" gap="1rem">
                            {/* Header del post */}
                            <Flex justifyContent="space-between" alignItems="flex-start">
                                <View flex="1">
                                    <Heading level={4} margin="0 0 0.5rem 0">
                                        {post.title}
                                    </Heading>
                                    <Flex gap="1rem" alignItems="center">
                                        <Text fontSize="0.875rem" color="gray">
                                            📅 {formatDate(post.publishedAt)}
                                        </Text>
                                        {post.authorId && (
                                            <Text fontSize="0.875rem" color="gray">
                                                👤 {post.authorId}
                                            </Text>
                                        )}
                                    </Flex>
                                </View>
                                
                                {/* Pulsanti azioni */}
                                <Flex gap="0.5rem">
                                    {(isAdmin || (currentUser && post.authorId === currentUser.userId)) && (
                                        <>
                                            <Button
                                                size="small"
                                                onClick={() => onEditPost(post)}
                                                variation="primary"
                                            >
                                                ✏️ Modifica
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => deletePost(post.id)}
                                                variation="destructive"
                                            >
                                                🗑️ Elimina
                                            </Button>
                                        </>
                                    )}
                                </Flex>
                            </Flex>

                            {/* Immagine */}
                            {post.imageUrl && (
                                <S3Image
                                    imageKey={post.imageUrl}
                                    alt={post.title}
                                    style={{
                                        maxHeight: '200px',
                                        width: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '8px'
                                    }}
                                />
                            )}

                            {/* Contenuto */}
                            <Text lineHeight="1.6">
                                {truncateContent(post.content, 200)}
                            </Text>

                            {/* Tags */}
                            {post.tags && (
                                <Flex gap="0.5rem" wrap="wrap">
                                    {post.tags.split(',').map((tag, index) => (
                                        <Badge key={index} size="small" variation="info">
                                            {tag.trim()}
                                        </Badge>
                                    ))}
                                </Flex>
                            )}
                        </Flex>
                    </Card>
                ))}
            </View>
        );
    }

    return (
        <View>
            {/* Header */}
            <Flex justifyContent="space-between" alignItems="center" marginBottom="2rem">
                <Heading level={2}>📰 Lista Post ({posts.length})</Heading>
                <Flex gap="1rem">
                    <Button onClick={onCreateNew} variation="primary">
                        ➕ Nuovo Post
                    </Button>
                    <Button onClick={onBack} variation="link">
                        ← Indietro
                    </Button>
                </Flex>
            </Flex>

            <Divider marginBottom="2rem" />

            {/* Contenuto */}
            {content}

            {/* Pulsante refresh se ci sono post */}
            {posts.length > 0 && (
                <Flex justifyContent="center" marginTop="2rem">
                    <Button onClick={fetchPosts} variation="outline" size="small">
                        🔄 Aggiorna
                    </Button>
                </Flex>
            )}
        </View>
    );
}