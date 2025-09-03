import axios from 'axios';

export const crawlArticle = async (url) => {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    const html = data.contents;
    
    // Parsing con DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Estrai titolo con più opzioni
    const title = extractTitle(doc);
    
    // Estrai tutto il contenuto senza limiti
    const content = extractContent(doc, url);
    
    return {
      title: cleanText(title),
      content: cleanText(content),
      url,
      source: new URL(url).hostname,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Errore crawling:', error);
    throw new Error('Impossibile crawlare l\'articolo');
  }
};

function extractTitle(doc) {
  const titleSelectors = [
    'h1',
    '.title',
    '.headline',
    '[class*="title"]',
    '[class*="headline"]',
    'title'
  ];
  
  for (const selector of titleSelectors) {
    const element = doc.querySelector(selector);
    if (element && element.textContent?.trim()) {
      return element.textContent.trim();
    }
  }
  
  return 'Titolo non trovato';
}

function extractContent(doc, url) {
  const domain = new URL(url).hostname.toLowerCase();
  
  // Selettori specifici per siti sportivi italiani
  const siteSpecificSelectors = {
    'gazzetta.it': [
      '.story-text p',
      '.article-body p',
      '.content p'
    ],
    'corrieredellosport.it': [
      '.art-text p',
      '.article-content p',
      '.content-body p'
    ],
    'tuttosport.com': [
      '.article-content p',
      '.post-content p',
      '.entry-content p'
    ],
    'sky.it': [
      '.content-body p',
      '.article-content p'
    ],
    'repubblica.it': [
      '.story p',
      '.article-body p'
    ],
    'ansa.it': [
      '.news-txt p',
      '.content p'
    ]
  };
  
  // Selettori generici per altri siti
  const genericSelectors = [
    'article p',
    '.post-content p',
    '.entry-content p',
    '.article-content p',
    '.content p',
    '.story p',
    '.text p',
    'main p',
    '[class*="content"] p',
    '[class*="article"] p',
    '[class*="story"] p',
    '[class*="text"] p'
  ];
  
  // Prova prima i selettori specifici per il sito
  const selectorsToTry = siteSpecificSelectors[domain] || genericSelectors;
  
  for (const selector of selectorsToTry) {
    const paragraphs = doc.querySelectorAll(selector);
    
    if (paragraphs.length > 0) {
      const content = Array.from(paragraphs)
        .map(p => p.textContent?.trim())
        .filter(text => text && text.length > 30) // Filtra paragrafi troppo corti
        .filter(text => !isUnwantedContent(text)) // Filtra contenuto indesiderato
        .join('\n\n'); // Mantieni la separazione tra paragrafi
      
      if (content.length > 200) { // Se abbiamo abbastanza contenuto
        return content;
      }
    }
  }
  
  // Fallback: prendi tutti i paragrafi senza filtri specifici
  const allParagraphs = doc.querySelectorAll('p');
  const fallbackContent = Array.from(allParagraphs)
    .map(p => p.textContent?.trim())
    .filter(text => text && text.length > 20)
    .filter(text => !isUnwantedContent(text))
    .join('\n\n');
  
  return fallbackContent || 'Contenuto non disponibile';
}

function isUnwantedContent(text) {
  const unwantedPhrases = [
    'cookie',
    'privacy',
    'accetto',
    'termini e condizioni',
    'newsletter',
    'iscriviti',
    'seguici su',
    'condividi',
    'commenta',
    'facebook',
    'twitter',
    'instagram',
    'telegram',
    'whatsapp',
    'pubblicità',
    'sponsor',
    'banner'
  ];
  
  const lowerText = text.toLowerCase();
  return unwantedPhrases.some(phrase => lowerText.includes(phrase));
}

function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ') // Sostituisce spazi multipli con uno singolo
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Rimuove righe vuote multiple
    .replace(/^\s+|\s+$/g, '') // Rimuove spazi all'inizio e alla fine
    .trim();
}