import { use, useState } from 'react';
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
import {generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient({ authMode: "userPool" });

export default function PostEditor({ onBack, signOut }) {
    const [post, setPost] = useState({
        title: '',
        content: '',
        category: '',
        tags: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const user = await getCurrentUser();
            const result = await client.models.Post.create({
                title: post.title,
                content: post.content,
                category: post.category,
                tags: post.tags,
                publishedAt: new Date().toISOString(),
                authorId: user.userId
            });
            console.log('Post created:', result);
            setSuccess('Post created successfully!');
            
            //reset
            setPost({
                title: '',
                content: '',
                category: '',
                tags: ''
            });
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (error) {
            console.error('Error creating post:', error);
            setError('Failed to create post.');
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
                <Heading level={1}>Create New Post</Heading>
                <Flex gap="1rem">
                    <Button variation='link' onClick={onBack}>
                        Back to Profile
                    </Button>
                    <Button onClick={signOut}>Sign Out</Button>
                </Flex>
            </Flex>

            {/**Alerts */}
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
                    <Button type="submit" variation='primary'>Submit Post
                    </Button>
                </Flex>
            </Flex>
        </Card>
        </Flex>
    )
}