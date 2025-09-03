import React, { useState } from 'react';
import { crawlArticle } from './utils/crawler';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

function CrawlerPanel({ onArticleCrawled, skipSave = false }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCrawl = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setResult(null);

    try {
      const article = await crawlArticle(url);
      setResult(article);
      
      if (!skipSave) {
        // Salva come bozza solo se non è in modalità skip
        const savedPost = await client.graphql({
          query: `
            mutation CreatePost($input: CreatePostInput!) {
              createPost(input: $input) {
                id
                title
                content
                status
              }
            }
          `,
          variables: {
            input: {
              title: article.title,
              content: article.content,
              imageUrl: article.imageUrl,
              status: 'draft'
            }
          }
        });
        onArticleCrawled?.(savedPost.data.createPost);
      } else {
        // Passa solo i dati dell'articolo al componente padre
        onArticleCrawled?.(article);
      }
      
      setUrl('');
    } catch (error) {
      alert('Errore nel crawling: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ marginTop: '0', color: '#333' }}>🕷️ Web Crawler</h3>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        {skipSave 
          ? 'Importa contenuto da un URL e popolerà automaticamente i campi del form'
          : 'Inserisci l\'URL di un articolo sportivo per importarlo automaticamente'
        }
      </p>
      
      <form onSubmit={handleCrawl}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.gazzetta.it/calcio/..."
          style={{ 
            width: '100%', 
            padding: '12px', 
            marginBottom: '15px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px'
          }}
          required
        />
        <button 
          type="submit" 
          disabled={loading || !url}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: loading ? '#6c757d' : '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {loading ? '🔄 Crawling in corso...' : `🚀 ${skipSave ? 'Importa nel Form' : 'Crawl e Salva'}`}
        </button>
      </form>

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>
            ✅ Articolo importato!
          </h4>
          <p><strong>Titolo:</strong> {result.title}</p>
          <p><strong>Fonte:</strong> {result.source}</p>
          <p><strong>Anteprima:</strong> {result.content.substring(0, 150)}...</p>
          {skipSave && (
            <p style={{ 
              margin: '10px 0 0 0', 
              padding: '8px',
              backgroundColor: '#b8daff',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              💡 I campi del form sono stati popolati automaticamente. 
              Puoi modificarli prima di salvare.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CrawlerPanel;