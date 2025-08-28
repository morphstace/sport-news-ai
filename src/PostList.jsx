import { useState, useEffect } from 'react';
import {
    Button,
    Heading,
    Flex,
    Card,
    Text,
    Badge,
    Divider,
    Grid,
    Alert
} from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { checkIfUserIsAdmin } from './utils/authUtils';

const client = generateClient({ authMode: "userPool" });

export default function PostList({ onBack, onCreateNew, onEditPost, signOut }) {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const user = await getCurrentUser();
            const isUserAdmin = await checkIfUserIsAdmin();
            
            let postsQuery;
            if (isUserAdmin) {
                // Admin vede tutti i post
                postsQuery = await client.models.Post.list();
            } else {
                // Utente normale vede solo i suoi post
                postsQuery = await client.models.Post.list({
                    filter: { authorId: { eq: user.userId } }
                });
            }

            const { data: posts } = postsQuery;
            const sortedPosts = posts.sort((a, b) => 
                new Date(b.publishedAt) - new Date(a.publishedAt)
            );
            
            setPosts(sortedPosts);
            setCurrentUser(user);
            setIsAdmin(isUserAdmin);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError('Failed to load posts');
        } finally {
            setIsLoading(false);
        }
    };

    const deletePost = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            await client.models.Post.delete({ id: postId });
            setPosts(posts.filter(post => post.id !== postId));
        } catch (err) {
            console.error('Error deleting post:', err);
            setError('Failed to delete post');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryColor = (category) => {
        const colors = {
            sports: 'blue',
            politics: 'red',
            technology: 'green',
            entertainment: 'orange',
            business: 'purple'
        };
        return colors[category] || 'gray';
    };

    return (
        <Flex
            direction="column"
            padding="2rem"
            maxWidth="1000px"
            margin="0 auto"
        >
            {/* Header */}
            <Flex justifyContent="space-between" alignItems="center" marginBottom="2rem">
                <Heading level={1}>My Posts ({posts.length})</Heading>
                <Flex gap="1rem">
                    <Button variation="primary" onClick={onCreateNew}>
                        + Create New Post
                    </Button>
                    <Button variation="link" onClick={onBack}>
                        ← Back to Profile
                    </Button>
                    <Button onClick={signOut}>Sign Out</Button>
                </Flex>
            </Flex>

            {/* Error Alert */}
            {error && (
                <Alert variation="error" marginBottom="1rem">
                    {error}
                </Alert>
            )}

            {/* Loading State */}
            {isLoading ? (
                <Flex justifyContent="center" alignItems="center" height="200px">
                    <Text>Loading posts...</Text>
                </Flex>
            ) : posts.length === 0 ? (
                /* Empty State */
                <Card padding="3rem" textAlign="center">
                    <Heading level={3} marginBottom="1rem">No posts yet</Heading>
                    <Text marginBottom="2rem">You haven't created any posts yet. Start by creating your first post!</Text>
                    <Button variation="primary" onClick={onCreateNew}>
                        Create Your First Post
                    </Button>
                </Card>
            ) : (
                /* Posts Grid */
                <Grid
                    templateColumns="repeat(auto-fill, minmax(350px, 1fr))"
                    gap="1.5rem"
                >
                    {posts.map((post) => (
                        <Card key={post.id} padding="1.5rem">
                            {/* Post Header */}
                            <Flex justifyContent="space-between" alignItems="flex-start" marginBottom="1rem">
                                <Badge variation={getCategoryColor(post.category)} size="small">
                                    {post.category}
                                </Badge>
                                <Text fontSize="small" color="gray">
                                    {formatDate(post.publishedAt)}
                                </Text>
                            </Flex>

                            {/* Post Title */}
                            <Heading level={4} marginBottom="0.5rem">
                                {post.title}
                            </Heading>

                            {/* Post Content Preview */}
                            <Text 
                                marginBottom="1rem" 
                                color="gray"
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
                                <Flex gap="0.5rem" marginBottom="1rem" wrap="wrap">
                                    {post.tags.split(',').map((tag, index) => (
                                        <Badge key={index} variation="outline" size="small">
                                            #{tag.trim()}
                                        </Badge>
                                    ))}
                                </Flex>
                            )}

                            <Divider marginBottom="1rem" />

                            {/* Post Actions */}
                            <Flex gap="0.5rem" justifyContent="flex-end">
                                <Button 
                                    size="small" 
                                    variation="link"
                                    onClick={() => onEditPost(post)}
                                >
                                    Edit
                                </Button>
                                <Button 
                                    size="small" 
                                    variation="link" 
                                    colorTheme="error"
                                    onClick={() => deletePost(post.id)}
                                >
                                    Delete
                                </Button>
                            </Flex>
                        </Card>
                    ))}
                </Grid>
            )}
        </Flex>
    );
}