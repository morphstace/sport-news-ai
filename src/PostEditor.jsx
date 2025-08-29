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
import { getCurrentUser } from 'aws-amplify/auth';

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

    useEffect(() => {
        if (editingPost) {
            setPost({
                title: editingPost.title,
                content: editingPost.content,
                category: editingPost.category,
                tags: editingPost.tags
            });
        }
    }, [editingPost]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const user = await getCurrentUser();
            
            if (isEditing) {
                await client.models.Post.update({
                    id: editingPost.id,
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    tags: post.tags
                });
                setSuccess('Post updated successfully!');
            } else {
                await client.models.Post.create({
                    title: post.title,
                    content: post.content,
                    category: post.category,
                    tags: post.tags,
                    publishedAt: new Date().toISOString(),
                    authorId: user.userId
                });
                setSuccess('Post created successfully!');
            }
            
            setPost({ title: '', content: '', category: '', tags: '' });
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (error) {
            console.error('Error saving post:', error);
            setError(`Failed to ${isEditing ? 'update' : 'create'} post.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Flex
            direction="column"
            padding="2rem"
            maxWidth="800px"
            margin="0 auto"
        >
            <Flex justifyContent="space-between" alignItems="center" marginBottom="2rem">
                <Heading level={1}>{isEditing ? 'Edit Post' : 'Create New Post'}</Heading>
                <Flex gap="1rem">
                    <Button variation='link' onClick={onBack}>
                        Back to Profile
                    </Button>
                    <Button onClick={signOut}>Sign Out</Button>
                </Flex>
            </Flex>

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