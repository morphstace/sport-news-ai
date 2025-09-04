import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { useNavigate } from 'react-router-dom';
import {
  View,
  Text,
  Button,
  Flex,
  Card,
  Heading,
  SearchField,
  Badge,
  Image,
  Alert,
  SelectField
} from '@aws-amplify/ui-react';

const client = generateClient({ authMode: "apiKey" });

export default function PostBrowser({ onBack }) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [authors, setAuthors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [searchQuery, selectedCategory, posts]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const { data: publicPosts } = await client.models.Post.list();
      
      // Recupera i profili utente per gli autori
      const { data: userProfiles } = await client.models.UserProfile.list();
      
      // Crea un mapping degli autori
      const authorsMap = {};
      userProfiles.forEach(profile => {
        authorsMap[profile.profileOwner] = {
          name: profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Autore Anonimo',
          firstName: profile.firstName,
          lastName: profile.lastName
        };
      });
      setAuthors(authorsMap);
      
      // Ordina i post per data di pubblicazione (più recenti prima)
      const sortedPosts = publicPosts.sort((a, b) => 
        new Date(b.publishedAt) - new Date(a.publishedAt)
      );
      
      setPosts(sortedPosts);
      setFilteredPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = [...posts];

    // Filtra per categoria se selezionata
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => {
        const category = getMainCategory(post.tags);
        return category.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    // Filtra per ricerca testuale
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        (post.tags && post.tags.toLowerCase().includes(query)) ||
        (authors[post.authorId]?.name.toLowerCase().includes(query))
      );
    }

    setFilteredPosts(filtered);
  };

  // Funzione per ottenere il primo tag come categoria
  const getMainCategory = (tags) => {
    if (!tags) return 'SPORT';
    const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    return tagList.length > 0 ? tagList[0].toUpperCase() : 'SPORT';
  };

  // Ottieni tutte le categorie uniche
  const getUniqueCategories = () => {
    const categories = new Set();
    posts.forEach(post => {
      const category = getMainCategory(post.tags);
      categories.add(category);
    });
    return Array.from(categories).sort();
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <View padding="2rem" textAlign="center">
        <Text>Caricamento articoli...</Text>
      </View>
    );
  }

  return (
    <View padding="2rem" maxWidth="1200px" margin="0 auto">
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center" marginBottom="2rem">
        <Heading level={2}>📰 Tutti gli Articoli ({filteredPosts.length})</Heading>
        <Button onClick={onBack} variation="link">
          ← Torna Indietro
        </Button>
      </Flex>

      {/* Filtri e Ricerca */}
      <Card padding="1.5rem" marginBottom="2rem">
        <Flex direction="column" gap="1rem">
          <Heading level={4}>Cerca e Filtra</Heading>
          <Flex gap="1rem" wrap="wrap" alignItems="end">
            <View flex="1" minWidth="200px">
              <SearchField
                label="Cerca negli articoli"
                placeholder="Titolo, contenuto, tag o autore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </View>
            <View minWidth="150px">
              <SelectField
                label="Categoria"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Tutte le categorie</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </SelectField>
            </View>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              variation="outline"
              size="small"
            >
              Reset
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* Risultati */}
      {filteredPosts.length === 0 ? (
        <Alert variation="info">
          {searchQuery || selectedCategory !== 'all' 
            ? 'Nessun articolo trovato con i filtri selezionati.' 
            : 'Nessun articolo disponibile.'
          }
        </Alert>
      ) : (
        <Flex direction="column" gap="1.5rem">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              padding="1.5rem"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <Flex direction="row" gap="1.5rem">
                {/* Immagine del post */}
                {post.imageUrl && (
                  <View minWidth="200px" maxWidth="200px">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      width="100%"
                      height="120px"
                      objectFit="cover"
                      borderRadius="8px"
                    />
                  </View>
                )}

                {/* Contenuto del post */}
                <Flex direction="column" flex="1" gap="0.5rem">
                  {/* Header del post */}
                  <Flex justifyContent="space-between" alignItems="flex-start" wrap="wrap" gap="0.5rem">
                    <Badge size="small" variation="info">
                      {getMainCategory(post.tags)}
                    </Badge>
                    <Text fontSize="small" color="gray">
                      {formatDate(post.publishedAt)}
                    </Text>
                  </Flex>

                  {/* Titolo */}
                  <Heading level={4} margin="0">
                    {post.title}
                  </Heading>

                  {/* Autore */}
                  <Text fontSize="small" color="gray">
                    di {authors[post.authorId]?.name || 'Autore Anonimo'}
                  </Text>

                  {/* Anteprima contenuto */}
                  <Text color="gray" lineHeight="1.5">
                    {truncateContent(post.content, 200)}
                  </Text>

                  {/* Tags */}
                  {post.tags && (
                    <Flex gap="0.5rem" wrap="wrap" marginTop="0.5rem">
                      {post.tags.split(',').slice(0, 4).map((tag, index) => {
                        const trimmedTag = tag.trim();
                        return (
                          <Badge key={index} variation="outline" size="small">
                            #{trimmedTag}
                          </Badge>
                        );
                      })}
                      {post.tags.split(',').length > 4 && (
                        <Text fontSize="small" color="gray">
                          +{post.tags.split(',').length - 4} altri
                        </Text>
                      )}
                    </Flex>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      {/* Footer con statistiche */}
      {filteredPosts.length > 0 && (
        <Flex justifyContent="center" marginTop="2rem" padding="1rem">
          <Text fontSize="small" color="gray">
            Mostrando {filteredPosts.length} di {posts.length} articoli
          </Text>
        </Flex>
      )}
    </View>
  );
}