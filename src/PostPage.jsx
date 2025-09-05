import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Card, Heading, Text, Badge, Flex, Button } from '@aws-amplify/ui-react';
import S3Image from './components/S3Image';

const client = generateClient({ authMode: "apiKey" });

export default function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data: postData } = await client.models.Post.get({ id: postId });
        
        if (!postData) {
          setError('Post non trovato');
          setLoading(false);
          return;
        }
        
        setPost(postData);
        
        if (postData?.authorId) {
          const { data: userProfiles } = await client.models.UserProfile.list();
          const authorProfile = userProfiles.find(profile => 
            profile.profileOwner === postData.authorId
          );
          
          if (authorProfile) {
            setAuthor({
              name: authorProfile.name || 
                    `${authorProfile.firstName || ''} ${authorProfile.lastName || ''}`.trim() || 
                    'Autore Anonimo',
              firstName: authorProfile.firstName,
              lastName: authorProfile.lastName,
              email: authorProfile.email
            });
          } else {
            setAuthor({ name: 'Autore Anonimo' });
          }
        } else {
          setAuthor({ name: 'Autore Anonimo' });
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        setError('Errore nel caricamento del post');
      } finally {
        setLoading(false);
      }
    }
    
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Funzione per ottenere il primo tag come categoria
  const getMainCategory = (tags) => {
    if (!tags) return 'SPORT';
    const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    return tagList.length > 0 ? tagList[0].toUpperCase() : 'SPORT';
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        weekday: 'long',
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

  if (loading) {
    return (
      <Flex direction="column" alignItems="center" padding="2rem" justifyContent="center" minHeight="50vh">
        <Text>Caricamento post...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex direction="column" alignItems="center" padding="2rem" justifyContent="center" minHeight="50vh">
        <Text color="red" marginBottom="1rem">{error}</Text>
        <Button variation="primary" onClick={() => navigate('/')}>
          Torna alla Home
        </Button>
      </Flex>
    );
  }

  if (!post) {
    return (
      <Flex direction="column" alignItems="center" padding="2rem" justifyContent="center" minHeight="50vh">
        <Text marginBottom="1rem">Post non trovato</Text>
        <Button variation="primary" onClick={() => navigate('/')}>
          Torna alla Home
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" alignItems="center" padding="2rem">
      {/* Back Button */}
      <Flex justifyContent="flex-start" width="100%" maxWidth="800px" marginBottom="1rem">
        <Button 
          variation="link" 
          onClick={() => navigate(-1)}
        >
          ← Indietro
        </Button>
      </Flex>

      <Card maxWidth="800px" width="100%" padding="2rem">
        {/* Header con categoria e data */}
        <Flex justifyContent="space-between" alignItems="center" marginBottom="1.5rem">
          <Badge size="small" variation="info">
            {getMainCategory(post.tags)}
          </Badge>
          <Text fontSize="small" color="gray">
            {formatDate(post.publishedAt)}
          </Text>
        </Flex>
        
        {/* Titolo */}
        <Heading level={1} marginBottom="1rem">
          {post.title}
        </Heading>
        
        {/* Autore */}
        {author && (
          <Text fontSize="medium" color="gray" marginBottom="2rem" fontStyle="italic">
            di {author.name}
          </Text>
        )}

        {/* Immagine del post */}
        {post.imageUrl && (
          <S3Image
            imageKey={post.imageUrl}
            alt={post.title}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '2rem'
            }}
          />
        )}
        
        {/* Contenuto */}
        <Text 
          marginBottom="2rem" 
          lineHeight="1.7"
          fontSize="medium"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {post.content}
        </Text>
        
        {/* Tags */}
        {post.tags && (
          <Flex direction="column" gap="1rem">
            <Text fontSize="small" fontWeight="bold" color="gray">
              Tags:
            </Text>
            <Flex gap="0.5rem" wrap="wrap">
              {post.tags.split(',').map((tag, idx) => {
                const trimmedTag = tag.trim();
                return (
                  <Badge key={idx} variation="outline" size="small">
                    #{trimmedTag}
                  </Badge>
                );
              })}
            </Flex>
          </Flex>
        )}

        {/* Info aggiuntive */}
        <Flex 
          justifyContent="space-between" 
          alignItems="center" 
          marginTop="3rem"
          padding="1rem 0"
          style={{ borderTop: '1px solid #e0e0e0' }}
        >
          <Text fontSize="small" color="gray">
            Pubblicato il {formatDate(post.publishedAt)}
          </Text>
          {post.updatedAt && post.updatedAt !== post.createdAt && (
            <Text fontSize="small" color="gray">
              Aggiornato il {formatDate(post.updatedAt)}
            </Text>
          )}
        </Flex>
      </Card>
    </Flex>
  );
}