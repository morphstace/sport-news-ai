import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Card, Heading, Text, Badge, Flex, Image, Button } from '@aws-amplify/ui-react';

const client = generateClient({ authMode: "apiKey" });

export default function PostPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data: postData } = await client.models.Post.get({ id: postId });
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
      }
    }
    fetchPost();
  }, [postId]);

  if (!post) return <Text>Loading...</Text>;

  return (
    <Flex direction="column" alignItems="center" padding="2rem">
      {/* Back Button */}
      <Flex justifyContent="flex-start" width="100%" maxWidth="800px" marginBottom="1rem">
        <Button 
          variation="link" 
          onClick={() => navigate(-1)}
        >
          ← Back
        </Button>
      </Flex>

      <Card maxWidth="800px" width="100%">
        <Flex justifyContent="space-between" alignItems="center" marginBottom="1rem">
          <Badge size="small">{post.category.toUpperCase()}</Badge>
          <Text fontSize="small" color="gray">
            {new Date(post.publishedAt).toLocaleDateString('it-IT')}
          </Text>
        </Flex>
        
        <Heading level={2} marginBottom="0.5rem">{post.title}</Heading>
        
        {author && (
          <Text fontSize="small" color="gray" marginBottom="1rem" fontStyle="italic">
            di {author.name}
          </Text>
        )}

        {/* Post Image */}
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt={post.title}
            width="100%"
            maxHeight="400px"
            objectFit="cover"
            borderRadius="8px"
            marginBottom="1rem"
          />
        )}
        
        <Text marginBottom="1rem">{post.content}</Text>
        
        {post.tags && (
          <Flex gap="0.5rem" wrap="wrap">
            {post.tags.split(',').map((tag, idx) => (
              <Badge key={idx} variation="outline" size="small">#{tag.trim()}</Badge>
            ))}
          </Flex>
        )}
      </Card>
    </Flex>
  );
}