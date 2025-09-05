import { Button, Heading, Flex, Text, Divider, Card, Badge } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useNavigate } from 'react-router-dom';
import S3Image from './components/S3Image'; // Importa il nuovo componente

const client = generateClient({ authMode: "apiKey" });

export default function HomePage({ onLoginClick }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicPosts();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const fetchPublicPosts = async () => {
    try {
      const { data: publicPosts } = await client.models.Post.list();
      
      // Recupera i profili utente per gli autori
      const { data: userProfiles } = await client.models.UserProfile.list();
      
      // Associa ogni post con il profilo dell'autore
      const postsWithAuthors = publicPosts.map(post => {
        const author = userProfiles.find(profile => profile.profileOwner === post.authorId);
        return {
          ...post,
          author: author ? {
            name: author.name || `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Autore Anonimo',
            firstName: author.firstName,
            lastName: author.lastName
          } : { name: 'Autore Anonimo' }
        };
      });
      
      const sortedPosts = postsWithAuthors.sort((a, b) => 
        new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 6);
      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching public posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione per ottenere il primo tag come categoria
  const getMainCategory = (tags) => {
    if (!tags) return 'SPORT';
    const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    return tagList.length > 0 ? tagList[0].toUpperCase() : 'SPORT';
  };

  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      padding="2rem"
      gap="2rem"
      maxWidth="1200px"
      margin="0 auto"
    >

      <Divider />

      {/* Latest News Section */}
      <Flex direction="column" width="100%" gap="1rem">
        <Heading level={2} textAlign="center">Ultime notizie</Heading>
        
        {/* Extracted conditional rendering */}
        {(() => {
          if (isLoading) {
            return <Text textAlign="center">Caricando ultime notizie...</Text>;
          }
          if (posts.length > 0) {
            return (
              <Flex 
                direction="row" 
                wrap="wrap" 
                gap="1.5rem" 
                justifyContent="center"
              >
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    padding="1.5rem"
                    maxWidth="350px"
                    minHeight="200px"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {/* Post Header */}
                    <Flex 
                      justifyContent="space-between" 
                      alignItems="center" 
                      marginBottom="1rem"
                    >
                      <Badge size="small" variation="info">
                        {getMainCategory(post.tags)}
                      </Badge>
                      <Text fontSize="small" color="gray">
                        {formatDate(post.publishedAt)}
                      </Text>
                    </Flex>

                    {/* Post Image (se presente) */}
                    {post.imageUrl && (
                      <S3Image 
                        imageKey={post.imageUrl}
                        alt={post.title}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          marginBottom: '1rem'
                        }}
                      />
                    )}

                    {/* Post Title */}
                    <Heading level={4} marginBottom="0.5rem">
                      {post.title}
                    </Heading>

                    {/* Author */}
                    <Text fontSize="small" color="gray" marginBottom="0.5rem">
                      di {post.author.name}
                    </Text>

                    {/* Post Preview */}
                    <Text 
                      color="gray" 
                      marginBottom="1rem"
                      style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {post.content}
                    </Text>

                    {/* Tags */}
                    {post.tags && (
                      <Flex gap="0.5rem" wrap="wrap">
                        {post.tags.split(',').slice(0, 3).map((tag, index) => {
                          const trimmedTag = tag.trim();
                          return (
                            <Badge key={index} variation="outline" size="small">
                              #{trimmedTag}
                            </Badge>
                          );
                        })}
                      </Flex>
                    )}
                  </Card>
                ))}
              </Flex>
            );
          }
          // Fallback content quando non ci sono post
          return (
            <Flex direction="column" gap="1rem" textAlign="center">
              <Text>Non ci sono notizie pubblicate disponibili.</Text>
              <Text fontSize="small" color="gray">
                Torna più tardi per gli ultimi aggiornamenti sportivi!
              </Text>
            </Flex>
          );
        })()}
      </Flex>
    </Flex>
  );
}