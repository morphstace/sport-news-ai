import { Button, Heading, Flex, Text, Divider, Card, Badge } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useNavigate } from 'react-router-dom';

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
      {/* Header Section */}
      <Flex 
        direction="column" 
        alignItems="center" 
        textAlign="center"
        marginBottom="2rem"
      >
        <Heading level={1} marginBottom="1rem">Welcome to Sport News AI</Heading>
        <Text fontSize="large" maxWidth="600px" marginBottom="2rem">
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
      </Flex>

      <Divider />

      {/* Latest News Section */}
      <Flex direction="column" width="100%" gap="1rem">
        <Heading level={2} textAlign="center">Latest Sports News</Heading>
        
        {isLoading ? (
          <Text textAlign="center">Loading latest news...</Text>
        ) : posts.length > 0 ? (
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
                  <Badge size="small">
                    {post.category.toUpperCase()}
                  </Badge>
                  <Text fontSize="small" color="gray">
                    {formatDate(post.publishedAt)}
                  </Text>
                </Flex>

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
                    {post.tags.split(',').slice(0, 3).map((tag, index) => (
                      <Badge key={index} variation="outline" size="small">
                        #{tag.trim()}
                      </Badge>
                    ))}
                  </Flex>
                )}
              </Card>
            ))}
          </Flex>
        ) : (
          /* Fallback content quando non ci sono post */
          <Flex direction="column" gap="1rem" textAlign="center">
            <Text>No published news available yet.</Text>
            <Text fontSize="small" color="gray">
              Check back later for the latest sports updates!
            </Text>
            
            {/* Sample content per mostrare il layout */}
            <Divider margin="2rem 0" />
            <Heading level={3}>Coming Soon</Heading>
            <Flex direction="column" gap="0.5rem">
              <Text>• Live match updates and scores</Text>
              <Text>• Player transfer news and rumors</Text>
              <Text>• Championship schedules and results</Text>
              <Text>• Expert analysis and predictions</Text>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}