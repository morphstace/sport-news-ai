import { useState, useEffect } from 'react';
import {
    Button,
    Heading,
    Flex,
    Card,
    Text,
    Badge,
    Grid,
    Alert,
    Image,
    View
} from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import { checkIfUserIsAdmin } from './utils/authUtils';
import { useNavigate } from 'react-router-dom';

const client = generateClient({ authMode: "userPool" });

export default function PostList({ onBack, onCreateNew, onEditPost, signOut }) {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

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

    let content;
    if (isLoading) {
        content = (
            <Flex justifyContent="center" alignItems="center" height="200px">
                <Text>Loading posts...</Text>
            </Flex>
        );
    } else if (posts.length === 0) {
        content = (
            /* Empty State */
            <Card padding="3rem" textAlign="center">
                <Heading level={3} marginBottom="1rem">No posts yet</Heading>
                <Text marginBottom="2rem">You haven't created any posts yet. Start by creating your first post!</Text>
                <Button variation="primary" onClick={onCreateNew}>
                    Create Your First Post
                </Button>
            </Card>
        );
    } else {
        content = (
            /* Posts Grid */
            <Grid
                templateColumns="repeat(auto-fill, minmax(350px, 1fr))"
                gap="1.5rem"
            >
                {posts.map((post) => (
                    <Card
                        key={post.id}
                        padding="1.5rem"
                        margin="0.5rem 0"
                        width="100%"
                        variation="outlined"
                    >
                        <Flex direction="column" gap="1rem">
                            <Flex justifyContent="space-between" alignItems="flex-start">
                                <View flex="1">
                                    <Heading level={4} marginBottom="0.5rem">
                                        {post.title}
                                    </Heading>
                                    <Text fontSize="small" color="gray" marginBottom="0.5rem">
                                        {formatDate(post.publishedAt)}
                                    </Text>
                                    <Badge 
                                        size="small" 
                                        backgroundColor={getCategoryColor(post.category)}
                                        color="white"
                                        marginBottom="0.5rem"
                                    >
                                        {post.category.toUpperCase()}
                                    </Badge>
                                </View>
                                
                                {/* Post Image Thumbnail */}
                                {post.imageUrl && (
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        width="100px"
                                        height="100px"
                                        objectFit="cover"
                                        borderRadius="8px"
                                        marginLeft="1rem"
                                    />
                                )}
                            </Flex>
                            
                            <Text fontSize="small" color="gray">
                                {post.content.length > 150 
                                    ? `${post.content.substring(0, 150)}...` 
                                    : post.content
                                }
                            </Text>
                            
                            {post.tags && (
                                <Flex gap="0.5rem" wrap="wrap">
                                    {post.tags.split(',').map((tag) => {
                                        const trimmedTag = tag.trim();
                                        return (
                                            <Badge key={trimmedTag} variation="outline" size="small">
                                                #{trimmedTag}
                                            </Badge>
                                        );
                                    })}
                                </Flex>
                            )}
                            
                            <Flex gap="0.5rem" justifyContent="flex-end">
                                <Button 
                                    size="small" 
                                    variation="primary"
                                    onClick={() => navigate(`/post/${post.id}`)}
                                >
                                    View
                                </Button>
                                {(currentUser === post.authorId || isAdmin) && (
                                    <>
                                        <Button 
                                            size="small" 
                                            variation="link"
                                            onClick={() => onEditPost(post)}
                                        >
                                            Edit
                                        </Button>
                                        <Button 
                                            size="small" 
                                            variation="destructive"
                                            onClick={() => deletePost(post.id)}
                                        >
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </Flex>
                        </Flex>
                    </Card>
                ))}
            </Grid>
        );
    }

    return (
        <Flex
            className='App'
            justifyContent='center'
            alignItems="center"
            direction="column"
            width="70%"
            margin="0 auto"
            padding="2rem"
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

            {content}
        </Flex>
    );
}