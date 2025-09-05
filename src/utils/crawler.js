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
    
    // Rimuovi elementi indesiderati prima dell'estrazione
    removeUnwantedElements(doc);
    
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

function removeUnwantedElements(doc) {
  const unwantedSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    '.advertisement',
    '.ads',
    '.social',
    '.share',
    '.newsletter',
    '.cookie',
    '.sidebar',
    '.related',
    '.comments',
    '.comment',
    '[class*="ad"]',
    '[class*="banner"]',
    '[id*="ad"]',
    '[id*="banner"]'
  ];

  unwantedSelectors.forEach(selector => {
    const elements = doc.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
}

function extractTitle(doc) {
  // Prima prova con meta tags che sono più affidabili
  const metaSelectors = [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="title"]'
  ];
  
  for (const selector of metaSelectors) {
    const element = doc.querySelector(selector);
    const content = element?.getAttribute('content')?.trim();
    if (content && content.length > 5 && content.length < 200) {
      return content;
    }
  }
  
  // Selettori più ampi e meno specifici per il titolo
  const titleSelectors = [
    'h1', // Prova prima tutti gli h1
    '.title h1',
    '.headline h1',
    '.article-title h1',
    '.post-title h1',
    '.entry-title h1',
    '.story-title h1',
    '[class*="title"] h1',
    '[class*="headline"] h1',
    '.title',
    '.headline',
    '.article-title',
    '.post-title',
    '.entry-title',
    '.story-title',
    '[class*="title"]:not(title)',
    '[class*="headline"]',
    '[id*="title"]',
    '[id*="headline"]',
    'title' // Come ultimo fallback
  ];
  
  for (const selector of titleSelectors) {
    const elements = doc.querySelectorAll(selector);
    
    for (const element of elements) {
      const text = element.textContent?.trim();
      if (text && 
          text.length > 5 && 
          text.length < 200 && 
          !isNavigationOrMenuText(text) &&
          !text.toLowerCase().includes('menu') &&
          !text.toLowerCase().includes('navigation')) {
        return text;
      }
    }
  }
  
  // Fallback finale: cerca il primo h1 con testo significativo
  const allH1s = doc.querySelectorAll('h1');
  for (const h1 of allH1s) {
    const text = h1.textContent?.trim();
    if (text && text.length > 10 && text.length < 200) {
      return text;
    }
  }
  
  return 'Titolo non trovato';
}

function isNavigationOrMenuText(text) {
  const navigationKeywords = [
    'menu', 'navigation', 'nav', 'home', 'login', 'register',
    'search', 'cerca', 'accedi', 'registrati', 'contatti',
    'chi siamo', 'about', 'privacy', 'cookie'
  ];
  
  const lowerText = text.toLowerCase();
  return navigationKeywords.some(keyword => 
    lowerText === keyword || 
    (lowerText.length < 20 && lowerText.includes(keyword))
  );
}

function extractContent(doc, url) {
  const domain = new URL(url).hostname.toLowerCase();
  
  // Selettori più aggressivi e completi
  const siteSpecificSelectors = {
    'gazzetta.it': [
      '.story-text',
      '.article-body',
      '.content-body',
      '.post-content',
      '.entry-content'
    ],
    'corrieredellosport.it': [
      '.art-text',
      '.article-content',
      '.content-body',
      '.post-content'
    ],
    'tuttosport.com': [
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content-body'
    ],
    'sky.it': [
      '.content-body',
      '.article-content',
      '.story-content'
    ],
    'repubblica.it': [
      '.story',
      '.article-body',
      '.content-body'
    ],
    'ansa.it': [
      '.news-txt',
      '.content',
      '.article-body'
    ]
  };
  
  // Selettori generici molto più ampi
  const genericSelectors = [
    'article',
    '.post-content',
    '.entry-content',
    '.article-content',
    '.content-body',
    '.story-content',
    '.article-body',
    '.post-body',
    '.entry-body',
    '.content',
    '.story',
    '.text',
    'main',
    '[class*="content"]',
    '[class*="article"]',
    '[class*="story"]',
    '[class*="text"]',
    '[class*="body"]',
    '[role="main"]'
  ];
  
  // Prova prima i selettori specifici per il sito
  const selectorsToTry = [
    ...(siteSpecificSelectors[domain] || []),
    ...genericSelectors
  ];
  
  for (const selector of selectorsToTry) {
    const container = doc.querySelector(selector);
    
    if (container) {
      // Estrai tutto il testo dal contenitore, inclusi tutti i paragrafi, div, span, etc.
      const content = extractAllTextFromContainer(container);
      
      if (content && content.length > 300) { // Soglia più bassa
        return content;
      }
    }
  }
  
  // Fallback finale: estrai tutto il contenuto testuale dalla pagina
  const bodyContent = extractAllTextFromContainer(doc.body);
  return bodyContent || 'Contenuto non disponibile';
}

function extractAllTextFromContainer(container) {
  if (!container) return '';
  
  // Ottieni tutti gli elementi che contengono testo
  const textElements = container.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th');
  
  const textParts = [];
  
  // Se non ci sono elementi specifici, prendi tutto il testo
  if (textElements.length === 0) {
    const text = container.textContent?.trim();
    if (text && text.length > 50) {
      return text;
    }
  }
  
  // Estrai testo da tutti gli elementi
  textElements.forEach(element => {
    const text = element.textContent?.trim();
    if (text && 
        text.length > 15 && // Soglia molto bassa
        !isUnwantedContent(text) &&
        !textParts.some(existing => existing.includes(text) || text.includes(existing))) {
      textParts.push(text);
    }
  });
  
  // Se non abbiamo abbastanza contenuto, prendi tutto senza filtri
  if (textParts.join(' ').length < 500) {
    const allText = container.textContent?.trim();
    if (allText && allText.length > 200) {
      return allText;
    }
  }
  
  return textParts.join('\n\n');
}

function isUnwantedContent(text) {
  // Filtri molto più permissivi
  const unwantedPhrases = [
    'accetta cookie',
    'privacy policy',
    'newsletter',
    'iscriviti alla newsletter',
    'seguici su facebook',
    'seguici su twitter',
    'seguici su instagram'
  ];
  
  const lowerText = text.toLowerCase();
  
  // Solo se il testo è PRINCIPALMENTE composto da frasi indesiderate
  const unwantedCount = unwantedPhrases.filter(phrase => lowerText.includes(phrase)).length;
  const totalWords = text.split(' ').length;
  
  // Se più del 70% del testo è indesiderato, filtralo
  return unwantedCount > 0 && totalWords < 10;
}

function cleanText(text) {
  if (!text) return '';
  
  return text
    .replace(/\s+/g, ' ') // Sostituisce spazi multipli con uno singolo
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Rimuove righe vuote multiple
    .replace(/^\s+|\s+$/g, '') // Rimuove spazi all'inizio e alla fine
    .trim();
}