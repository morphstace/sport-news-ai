import { useEffect, useState } from 'react';
import {
    Button,
    Heading,
    Flex,
    TextField,
    TextAreaField,
    SelectField,
    Card,
    Alert,
    View,
    Image,
    Text
} from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

const client = generateClient({ authMode: "userPool" });

export default function PostEditor({ onBack, signOut, editingPost = null }) {
    const [post, setPost] = useState({
        title: '',
        content: '',
        category: '',
        tags: '',
        imageUrl: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const isEditing = !!editingPost;

    useEffect(() => {
        if (editingPost && editingPost.id) {
            setPost({
                title: editingPost.title || '',
                content: editingPost.content || '',
                category: editingPost.category || '',
                tags: editingPost.tags || '',
                imageUrl: editingPost.imageUrl || ''
            });
            
            // Se c'è un'immagine esistente, impostala come preview
            if (editingPost.imageUrl) {
                setImagePreview(editingPost.imageUrl);
            }
        } else {
            setPost({
                title: '',
                content: '',
                category: '',
                tags: '',
                imageUrl: ''
            });
            setImagePreview(null);
        }
        setImageFile(null);
    }, [editingPost]);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Verifica che sia un'immagine
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            
            // Verifica la dimensione (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }

            setImageFile(file);
            
            // Crea preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
            
            setError('');
        }
    };

    const uploadImage = async (userId) => {
        if (!imageFile) return null;

        console.log('Starting image upload...');
        setUploadingImage(true);
        try {
            const fileExtension = imageFile.name.split('.').pop();
            const fileName = `post-images/${userId}/${Date.now()}.${fileExtension}`;
            
            console.log('Upload fileName:', fileName);

            const result = await uploadData({
                key: fileName,
                data: imageFile,
                options: {
                    contentType: imageFile.type,
                    accessLevel: 'guest' // Questo è importante!
                }
            });

            console.log('Upload result:', result);

            // Aspetta che l'upload sia completato
            await result.result;

            // Ottieni l'URL pubblico
            const urlResult = await getUrl({
                key: fileName,
                options: {
                    accessLevel: 'guest', // Anche questo!
                    expiresIn: 31536000 // 1 year
                }
            });

            console.log('URL result:', urlResult);
            const finalUrl = urlResult.url.toString();
            console.log('Final URL:', finalUrl);

            return finalUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Failed to upload image: ' + error.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const removeCurrentImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setPost({ ...post, imageUrl: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const user = await getCurrentUser();
            const userAttributes = await fetchUserAttributes();
            const userId = user?.userId || user?.username || userAttributes?.sub || '';
            
            let imageUrl = post.imageUrl;

            // Se c'è una nuova immagine da caricare
            if (imageFile) {
                // Se stiamo editando e c'era già un'immagine, rimuoviamo la vecchia
                if (isEditing && post.imageUrl) {
                    try {
                        const oldKey = post.imageUrl.split('/').slice(-3).join('/');
                        await remove({ key: oldKey });
                    } catch (error) {
                        console.warn('Could not remove old image:', error);
                    }
                }

                imageUrl = await uploadImage(userId);
            }
            
            const postData = {
                title: post.title,
                content: post.content,
                category: post.category,
                tags: post.tags,
                imageUrl: imageUrl
            };

            if (isEditing) {
                const result = await client.models.Post.update({
                    id: editingPost.id,
                    ...postData
                });
                setSuccess('Post updated successfully!');
            } else {
                const result = await client.models.Post.create({
                    ...postData,
                    publishedAt: new Date().toISOString(),
                    authorId: userId
                });
                setSuccess('Post created successfully!');
            }
            
            if (!isEditing) {
                setPost({ title: '', content: '', category: '', tags: '', imageUrl: '' });
                setImageFile(null);
                setImagePreview(null);
            }
            
            setTimeout(() => {
                onBack();
            }, 2000);
        } catch (error) {
            console.error('Error submitting post:', error);
            setError(`Failed to ${isEditing ? 'update' : 'create'} post: ${error.message}`);
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

                    {/* Image Upload Section */}
                    <View>
                        <Text fontWeight="bold" marginBottom="0.5rem">Post Image (Optional)</Text>
                        
                        {imagePreview && (
                            <Flex direction="column" gap="1rem" marginBottom="1rem">
                                <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    maxHeight="200px"
                                    objectFit="cover"
                                    borderRadius="8px"
                                />
                                <Button
                                    type="button"
                                    variation="destructive"
                                    size="small"
                                    onClick={removeCurrentImage}
                                >
                                    Remove Image
                                </Button>
                            </Flex>
                        )}
                        
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                width: '100%'
                            }}
                        />
                        <Text fontSize="small" color="gray" marginTop="0.25rem">
                            Supported formats: JPG, PNG, GIF. Max size: 5MB
                        </Text>
                    </View>
                    
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
                        <Button 
                            type="submit" 
                            variation='primary' 
                            isLoading={isLoading || uploadingImage}
                        >
                            {uploadingImage ? 'Uploading...' : (isEditing ? 'Update Post' : 'Submit Post')}
                        </Button>
                    </Flex>
                </Flex>
            </Card>
        </Flex>
    )
}