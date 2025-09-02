import { useEffect, useState } from 'react';
import {
    Button,
    Heading,
    Flex,
    TextField,
    TextAreaField,
    SelectField,
    Card,
    Alert
} from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient({ authMode: "userPool" });

export default function PostEditor({ onBack, signOut, editingPost = null }) {
    const [post, setPost] = useState({
        title: '',
        content: '',
        category: '',
        tags: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isEditing = !!editingPost;

    // Debug: Log dettagliato di editingPost
    useEffect(() => {
        console.log('PostEditor useEffect triggered');
        console.log('editingPost:', editingPost);
        console.log('editingPost type:', typeof editingPost);
        console.log('editingPost keys:', editingPost ? Object.keys(editingPost) : 'no keys');
        
        if (editingPost) {
            console.log('editingPost.title:', editingPost.title);
            console.log('editingPost.content:', editingPost.content);
            console.log('editingPost.category:', editingPost.category);
            console.log('editingPost.tags:', editingPost.tags);
            console.log('editingPost.id:', editingPost.id);
        }

        if (editingPost && editingPost.id) {
            console.log('Setting post state with editingPost data');
            const newPost = {
                title: editingPost.title || '',
                content: editingPost.content || '',
                category: editingPost.category || '',
                tags: editingPost.tags || ''
            };
            console.log('New post state:', newPost);
            setPost(newPost);
        } else {
            console.log('Resetting post state to empty');
            setPost({
                title: '',
                content: '',
                category: '',
                tags: ''
            });
        }
    }, [editingPost]); // Cambiamo la dipendenza a editingPost completo

    // Debug: Log dello stato post quando cambia
    useEffect(() => {
        console.log('Post state changed:', post);
    }, [post]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            console.log('Getting current user...');
            const user = await getCurrentUser();
            console.log('Current user object:', user);
            console.log('Available user properties:', Object.keys(user));
            
            console.log('Fetching user attributes...');
            const userAttributes = await fetchUserAttributes();
            console.log('User attributes:', userAttributes);
            console.log('Available attribute keys:', Object.keys(userAttributes));
            
            // Test tutti i possibili ID
            console.log('user.userId:', user?.userId);
            console.log('user.username:', user?.username);
            console.log('userAttributes.sub:', userAttributes?.sub);
            
            const userId = user?.userId || user?.username || userAttributes?.sub || '';
            console.log('Final userId chosen:', userId);
            
            if (isEditing) {
                console.log('Updating post:', editingPost.id, 'with data:', post);
                const result = await client.models.Post.update({
                    id: editingPost.id,
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    tags: post.tags
                });
                console.log('Update result:', result);
                setSuccess('Post updated successfully!');
            } else {
                console.log('Creating new post with userId:', userId);
                const result = await client.models.Post.create({
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    tags: post.tags,
                    publishedAt: new Date().toISOString(),
                    authorId: userId
                });
                console.log('Create result:', result);
                console.log('Created post authorId:', result?.data?.authorId);
                setSuccess('Post created successfully!');
            }
            
            if (!isEditing) {
                setPost({ title: '', content: '', category: '', tags: '' });
            }
            
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (error) {
            console.error('Detailed error:', error);
            setError(`Failed to ${isEditing ? 'update' : 'create'} post: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Debug render
    console.log('Rendering PostEditor with post state:', post);

    return (
        <Flex
            direction="column"
            padding="2rem"
            maxWidth="800px"
            margin="0 auto"
        >
            <Flex justifyContent="space-between" alignItems="center" marginBottom="2rem">
                <Heading level={1}>
                    {isEditing ? `Edit Post: ${post.title || 'Untitled'}` : 'Create New Post'}
                </Heading>
                <Flex gap="1rem">
                    <Button variation='link' onClick={onBack}>
                        Back to Profile
                    </Button>
                    <Button onClick={signOut}>Sign Out</Button>
                </Flex>
            </Flex>

            {/* Debug info - rimuovi dopo aver risolto */}
            {isEditing && (
                <Alert variation="info" marginBottom="1rem">
                    Debug: Editing post with ID: {editingPost?.id} | Title: "{post.title}"
                </Alert>
            )}

            {error && (
                <Alert variation="error" marginBottom="1rem">
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variation="success" marginBottom="1rem">
                    {success}
                </Alert>
            )}

            <Card padding="2rem">
                <Flex as="form" onSubmit={handleSubmit} direction="column" gap="1.5rem">
                    <TextField
                        label="Post Title"
                        placeholder="Enter news title ..."
                        value={post.title}
                        onChange={(e) => setPost({ ...post, title: e.target.value })}
                        required
                    />

                    <SelectField
                        label="Category"
                        value={post.category}
                        onChange={(e) => setPost({ ...post, category: e.target.value })}
                        required
                    >
                        <option value="">Select a category</option>
                        <option value="sports">Sports</option>
                        <option value="politics">Politics</option>
                        <option value="technology">Technology</option>
                    </SelectField>

                    <TextField
                        label="Tags"
                        placeholder="Enter tags (comma separated)"
                        value={post.tags}
                        onChange={(e) => setPost({ ...post, tags: e.target.value })}
                    />
                    
                    <TextAreaField
                        label="Content"
                        placeholder="Enter post content ..."
                        value={post.content}
                        onChange={(e) => setPost({ ...post, content: e.target.value })}
                        rows={10}
                        required
                    />

                    <Flex gap="1rem" justifyContent="flex-end">
                        <Button type="button" variation="link" onClick={onBack}>
                            Cancel
                        </Button>
                        <Button type="submit" variation='primary' isLoading={isLoading}>
                            {isEditing ? 'Update Post' : 'Submit Post'}
                        </Button>
                    </Flex>
                </Flex>
            </Card>
        </Flex>
    )
}