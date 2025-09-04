import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { checkIfUserIsAdmin } from './utils/authUtils';
import { correctText, improveText, generateTags } from './utils/geminiConfig';
import CrawlerPanel from './CrawlerPanel';
import S3Image from './components/S3Image';
import { 
  Button,
  Heading,
  TextField,
  TextAreaField,
  Flex,
  View,
  Alert,
  Text,
  Card,
  Divider
} from '@aws-amplify/ui-react';

const client = generateClient({
  authMode: "userPool",
});

function PostEditor({ onBack, editingPost }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCrawler, setShowCrawler] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Aggiungi stato per l'AI
  const [aiLoading, setAiLoading] = useState({
    correctTitle: false,
    correctContent: false,
    improveTitle: false,
    improveContent: false,
    generateTags: false
  });
  
  // Modifica lo stato per gestire il confronto AI senza Modal
  const [showAiComparison, setShowAiComparison] = useState(false);
  const [aiComparison, setAiComparison] = useState({
    original: '',
    improved: '',
    type: '',
    field: ''
  });

  useEffect(() => {
    checkAdminPermissions();
  }, []);

  const checkAdminPermissions = async () => {
    try {
      const adminStatus = await checkIfUserIsAdmin();
      setIsAdmin(adminStatus);
      
      if (!adminStatus) {
        // Se non è admin, torna indietro
        setTimeout(() => {
          onBack();
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      onBack();
    } finally {
      setCheckingPermissions(false);
    }
  };

  useEffect(() => {
    if (editingPost) {
      setFormData({
        title: editingPost.title || '',
        content: editingPost.content || '',
        imageUrl: editingPost.imageUrl || '',
        tags: editingPost.tags || ''
      });
    } else {
      setFormData({
        title: '',
        content: '',
        imageUrl: '',
        tags: ''
      });
    }
  }, [editingPost]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Titolo e contenuto sono obbligatori');
      return;
    }

    setLoading(true);

    try {
      const currentUser = await getCurrentUser();
      
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags.trim(),
        publishedAt: new Date().toISOString(),
        authorId: currentUser.userId || currentUser.username
      };

      if (formData.imageUrl) {
        postData.imageUrl = formData.imageUrl;
      }

      if (editingPost?.id) {
        // Aggiorna post esistente
        const result = await client.models.Post.update({
          id: editingPost.id,
          ...postData
        });
        console.log('✅ Post aggiornato:', result);
      } else {
        // Crea nuovo post
        const result = await client.models.Post.create(postData);
        console.log('✅ Post creato:', result);
      }

      // Torna alla lista dei post
      onBack();
      
    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error);
      alert('Errore nel salvataggio del post: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCrawledArticle = (article) => {
    const autoTags = generateAutoTags(article);
    
    setFormData(prev => ({
      ...prev,
      title: article.title,
      content: article.content,
      tags: autoTags
    }));
    setShowCrawler(false);
  };

  const generateAutoTags = (article) => {
    const tags = [];
    
    if (article.source) {
      if (article.source.includes('gazzetta')) tags.push('Gazzetta dello Sport');
      if (article.source.includes('corriere')) tags.push('Corriere dello Sport');
      if (article.source.includes('tuttosport')) tags.push('Tuttosport');
    }
    
    const content = (article.title + ' ' + article.content).toLowerCase();
    
    if (content.includes('calcio') || content.includes('serie a')) tags.push('Calcio');
    if (content.includes('juventus') || content.includes('juve')) tags.push('Juventus');
    if (content.includes('inter') || content.includes('nerazzurr')) tags.push('Inter');
    if (content.includes('milan') || content.includes('rossoneri')) tags.push('Milan');
    if (content.includes('roma')) tags.push('Roma');
    if (content.includes('napoli')) tags.push('Napoli');
    if (content.includes('basket')) tags.push('Basket');
    if (content.includes('tennis')) tags.push('Tennis');
    if (content.includes('formula 1') || content.includes('f1')) tags.push('Formula 1');
    
    return tags.join(', ');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona solo file immagine');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'immagine è troppo grande. Massimo 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const fileExtension = file.name.split('.').pop();
      // Usa public/posts/ per la cartella
      const fileName = `public/posts/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

      const result = await uploadData({
        key: fileName,
        data: file,
        options: {
          contentType: file.type,
          accessLevel: 'guest'
        }
      }).result;

      // Salva solo la chiave S3
      setFormData(prev => ({
        ...prev,
        imageUrl: result.key
      }));

    } catch (error) {
      console.error('❌ Errore nel caricamento dell\'immagine:', error);
      alert('Errore nel caricamento dell\'immagine: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
  };

  const suggestedTags = [
    'Calcio', 'Serie A', 'Champions League', 'Europa League',
    'Juventus', 'Inter', 'Milan', 'Roma', 'Napoli', 'Lazio',
    'Basket', 'Tennis', 'Formula 1', 'MotoGP', 'Ciclismo',
    'Olimpiadi', 'Nazionale', 'Mercato'
  ];

  const addSuggestedTag = (tag) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData(prev => ({
        ...prev,
        tags: newTags
      }));
    }
  };

  // Funzioni AI integrate
  const handleAiAction = async (action, field) => {
    const fieldValue = formData[field];
    if (!fieldValue?.trim()) {
      alert(`Inserisci ${field === 'title' ? 'un titolo' : 'del contenuto'} prima di usare l'AI`);
      return;
    }

    const loadingKey = `${action}${field.charAt(0).toUpperCase() + field.slice(1)}`;
    setAiLoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      let result;
      if (action === 'correct') {
        result = await correctText(fieldValue);
      } else if (action === 'improve') {
        result = await improveText(fieldValue, field === 'title' ? 'title' : 'article');
      }

      if (result && result !== fieldValue) {
        setAiComparison({
          original: fieldValue,
          improved: result,
          type: action === 'correct' ? 'Correzione' : 'Miglioramento',
          field: field
        });
        setShowAiComparison(true);
      } else {
        alert(`Il ${field === 'title' ? 'titolo' : 'contenuto'} non necessita ${action === 'correct' ? 'correzioni' : 'miglioramenti'}`);
      }
    } catch (error) {
      console.error(`Errore ${action}:`, error);
      alert(`Errore nell'${action === 'correct' ? 'correzione' : 'miglioramento'}: ${error.message}`);
    } finally {
      setAiLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleGenerateAiTags = async () => {
    if (!formData.title?.trim() && !formData.content?.trim()) {
      alert('Inserisci titolo o contenuto prima di generare i tag');
      return;
    }

    setAiLoading(prev => ({ ...prev, generateTags: true }));
    try {
      const aiTags = await generateTags(formData.title || '', formData.content || '');
      const newTags = formData.tags ? `${formData.tags}, ${aiTags}` : aiTags;
      setFormData(prev => ({ ...prev, tags: newTags }));
    } catch (error) {
      console.error('Errore generazione tag:', error);
      alert(`Errore nella generazione tag: ${error.message}`);
    } finally {
      setAiLoading(prev => ({ ...prev, generateTags: false }));
    }
  };

  const acceptAiChange = () => {
    setFormData(prev => ({
      ...prev,
      [aiComparison.field]: aiComparison.improved
    }));
    setShowAiComparison(false);
    setAiComparison({ original: '', improved: '', type: '', field: '' });
  };

  const rejectAiChange = () => {
    setShowAiComparison(false);
    setAiComparison({ original: '', improved: '', type: '', field: '' });
  };

  if (checkingPermissions) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="50vh">
        <Heading level={3}>Verifica permessi...</Heading>
      </Flex>
    );
  }

  if (!isAdmin) {
    return (
      <Flex 
        direction="column" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
        padding="2rem"
      >
        <Alert variation="error" hasIcon={true} marginBottom="2rem">
          <strong>Accesso Negato</strong><br />
          Solo gli amministratori possono creare o modificare i post.
        </Alert>
        <Button variation="primary" onClick={onBack}>
          Torna Indietro
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" padding="2rem" maxWidth="800px" margin="0 auto">
      <Flex justifyContent="space-between" alignItems="center" marginBottom="2rem">
        <Heading level={2}>
          {editingPost ? 'Modifica Post' : 'Nuovo Post'}
        </Heading>
        <Flex gap="1rem">
          <Button 
            onClick={() => setShowCrawler(!showCrawler)}
            variation={showCrawler ? "destructive" : "primary"}
            size="small"
          >
            {showCrawler ? '❌ Chiudi Crawler' : '🕷️ Usa Crawler'}
          </Button>
          <Button 
            onClick={onBack}
            variation="link"
            size="small"
          >
            Annulla
          </Button>
        </Flex>
      </Flex>

      {/* AI Comparison Section - Sostituisce il Modal */}
      {showAiComparison && (
        <Card padding="1.5rem" marginBottom="1rem" border="2px solid #007bff" backgroundColor="#f8f9ff">
          <Heading level={4} marginBottom="1rem">
            {aiComparison.type} {aiComparison.field === 'title' ? 'Titolo' : 'Contenuto'}
          </Heading>
          
          <Flex direction="column" gap="1rem">
            <View>
              <Text fontWeight="bold" marginBottom="0.5rem" color="#666">
                📝 Testo Originale:
              </Text>
              <Card
                padding="1rem"
                backgroundColor="#fff"
                border="1px solid #ddd"
                maxHeight="200px"
                overflow="auto"
              >
                <Text fontSize="0.9rem" lineHeight="1.5">
                  {aiComparison.original}
                </Text>
              </Card>
            </View>
            
            <View>
              <Text fontWeight="bold" marginBottom="0.5rem" color="green">
                ✨ Testo {aiComparison.type === 'Correzione' ? 'Corretto' : 'Migliorato'}:
              </Text>
              <Card
                padding="1rem"
                backgroundColor="#f8fff8"
                border="2px solid #28a745"
                maxHeight="200px"
                overflow="auto"
              >
                <Text fontSize="0.9rem" lineHeight="1.5">
                  {aiComparison.improved}
                </Text>
              </Card>
            </View>
          </Flex>

          <Flex justifyContent="flex-end" gap="1rem" marginTop="1rem">
            <Button variation="outline" onClick={rejectAiChange}>
              ❌ Rifiuta
            </Button>
            <Button variation="primary" onClick={acceptAiChange}>
              ✅ Accetta Modifica
            </Button>
          </Flex>
        </Card>
      )}

      {showCrawler && (
        <View marginBottom="2rem">
          <CrawlerPanel 
            onArticleCrawled={handleCrawledArticle}
            skipSave={true}
          />
        </View>
      )}

      {/* AI Tools Panel */}
      <View 
        padding="1rem" 
        border="1px solid #e0e0e0" 
        borderRadius="8px" 
        backgroundColor="#f8f9fa"
        marginBottom="1rem"
      >
        <Heading level={5} marginBottom="0.5rem">🤖 Assistente AI</Heading>
        <Flex gap="0.5rem" wrap="wrap" alignItems="center">
          <Button
            size="small"
            variation="outline"
            onClick={() => handleAiAction('correct', 'title')}
            isLoading={aiLoading.correctTitle}
            isDisabled={!formData.title?.trim() || Object.values(aiLoading).some(l => l)}
          >
            ✏️ Correggi Titolo
          </Button>
          <Button
            size="small"
            variation="outline"
            onClick={() => handleAiAction('correct', 'content')}
            isLoading={aiLoading.correctContent}
            isDisabled={!formData.content?.trim() || Object.values(aiLoading).some(l => l)}
          >
            ✏️ Correggi Contenuto
          </Button>
          <Button
            size="small"
            variation="primary"
            onClick={() => handleAiAction('improve', 'title')}
            isLoading={aiLoading.improveTitle}
            isDisabled={!formData.title?.trim() || Object.values(aiLoading).some(l => l)}
          >
            ✨ Migliora Titolo
          </Button>
          <Button
            size="small"
            variation="primary"
            onClick={() => handleAiAction('improve', 'content')}
            isLoading={aiLoading.improveContent}
            isDisabled={!formData.content?.trim() || Object.values(aiLoading).some(l => l)}
          >
            ✨ Migliora Contenuto
          </Button>
          <Button
            size="small"
            variation="link"
            onClick={handleGenerateAiTags}
            isLoading={aiLoading.generateTags}
            isDisabled={(!formData.title?.trim() && !formData.content?.trim()) || Object.values(aiLoading).some(l => l)}
          >
            🏷️ Genera Tag AI
          </Button>
        </Flex>
      </View>

      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="1.5rem">
          <TextField
            label="Titolo"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Inserisci il titolo del post..."
          />

          <View>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              Contenuto
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={15}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Scrivi il contenuto del post..."
            />
          </View>

          <View>
            <TextField
              label="Tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Calcio, Serie A, Juventus..."
            />
            
            <View marginTop="0.5rem">
              <View marginBottom="0.5rem" fontSize="0.875rem" fontWeight="bold">
                Tag suggeriti:
              </View>
              <Flex wrap="wrap" gap="0.25rem">
                {suggestedTags.map(tag => (
                  <Button
                    key={tag}
                    size="small"
                    variation={formData.tags.includes(tag) ? "primary" : "outline"}
                    onClick={() => addSuggestedTag(tag)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '1rem'
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </Flex>
            </View>
          </View>

          <View>
            <View marginBottom="1rem" fontSize="1rem" fontWeight="bold">
              Immagine
            </View>
            
            <Flex gap="0.5rem" marginBottom="1rem">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <Button 
                as="label" 
                htmlFor="image-upload"
                variation="primary"
                isDisabled={uploadingImage}
              >
                {uploadingImage ? '📤 Caricando...' : '📁 Carica Immagine'}
              </Button>
              
              {formData.imageUrl && (
                <Button
                  onClick={removeImage}
                  variation="destructive"
                >
                  🗑️ Rimuovi
                </Button>
              )}
            </Flex>

            {formData.imageUrl ? (
              <View 
                border="2px dashed #ccc"
                borderRadius="8px"
                padding="1rem"
                textAlign="center"
              >
                <S3Image 
                  imageKey={formData.imageUrl}
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
              </View>
            ) : (
              <View
                border="2px dashed #ccc"
                borderRadius="8px"
                padding="2rem"
                textAlign="center"
                color="#666"
                backgroundColor="#f8f9fa"
              >
                <View>📷 Nessuna immagine selezionata</View>
                <View fontSize="0.875rem" marginTop="0.5rem">
                  Formati supportati: JPG, PNG, GIF, WebP (max 5MB)
                </View>
              </View>
            )}
          </View>

          <Flex justifyContent="flex-end" gap="1rem" marginTop="2rem">
            <Button
              onClick={onBack}
              variation="outline"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variation="primary"
              isLoading={loading}
              isDisabled={uploadingImage}
            >
              {loading ? 'Salvando...' : (editingPost ? '💾 Aggiorna Post' : '🚀 Pubblica Post')}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Flex>
  );
}

export default PostEditor;