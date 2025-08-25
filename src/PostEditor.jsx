import { use, useState } from 'react';
import {
    Button,
    Heading,
    Flex,
    TextField,
    TextAreaField,
    SelectField,
    Card
} from '@aws-amplify/ui-react';

export default function PostEditor({ onBack, signOut }) {
    const [post, setPost] = useState({
        title: '',
        content: '',
        category: '',
        tags: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Handle form submission
        console.log('Post submitted:', post);
        alert('Post submitted!');
        onBack();
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