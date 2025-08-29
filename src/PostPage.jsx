import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Card, Heading, Text, Badge, Flex } from '@aws-amplify/ui-react';

const client = generateClient({ authMode: "apiKey" });

export default function PostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      const { data } = await client.models.Post.get({ id: postId });
      setPost(data);
    }
    fetchPost();
  }, [postId]);

  if (!post) return <Text>Loading...</Text>;

  return (
    <Flex direction="column" alignItems="center" padding="2rem">
      <Card maxWidth="600px" width="100%">
        <Flex justifyContent="space-between" alignItems="center" marginBottom="1rem">
          <Badge size="small">{post.category.toUpperCase()}</Badge>
          <Text fontSize="small" color="gray">
            {new Date(post.publishedAt).toLocaleDateString('it-IT')}
          </Text>
        </Flex>
        <Heading level={2} marginBottom="1rem">{post.title}</Heading>
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