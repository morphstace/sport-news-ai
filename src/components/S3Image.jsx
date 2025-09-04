import React, { useState, useEffect, useCallback } from 'react';
import { getUrl } from 'aws-amplify/storage';

// Cache globale per URL con timestamp
const urlCache = new Map();
const CACHE_DURATION = 14 * 60 * 1000; // 14 minuti (1 minuto prima della scadenza)

const S3Image = ({ imageKey, alt, style, ...props }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadImage = useCallback(async () => {
    if (!imageKey) {
      setLoading(false);
      return;
    }

    try {
      setError(false);
      
      // Se imageKey è già un URL completo, usalo direttamente
      if (imageKey.startsWith('http')) {
        console.log('🔗 [S3Image] Using direct URL for:', imageKey.substring(0, 50) + '...');
        setImageUrl(imageKey);
        setLoading(false);
        return;
      }

      // Controlla se abbiamo un URL valido in cache
      const cached = urlCache.get(imageKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        // Usa URL dalla cache se ancora valido
        const remainingTime = Math.round((CACHE_DURATION - (now - cached.timestamp)) / 1000 / 60);
        console.log(`📦 [S3Image] Using cached URL for: ${imageKey} (expires in ${remainingTime} min)`);
        setImageUrl(cached.url);
        setLoading(false);
        return;
      }

      // Genera nuovo URL solo se necessario
      console.log('🌐 [S3Image] Generating new S3 URL for:', imageKey);
      const urlResult = await getUrl({
        key: imageKey,
        options: {
          accessLevel: 'guest',
          validateObjectExistence: false
        }
      });

      const newUrl = urlResult.url.toString();
      
      // Salva in cache con timestamp
      urlCache.set(imageKey, {
        url: newUrl,
        timestamp: now
      });

      console.log(`✅ [S3Image] New URL cached for: ${imageKey} (cache size: ${urlCache.size})`);
      setImageUrl(newUrl);
    } catch (err) {
      console.error('❌ [S3Image] Error loading image:', imageKey, err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [imageKey]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Gestisci solo errori di caricamento (no refresh automatico)
  const handleImageError = useCallback(() => {
    if (!error && imageUrl && !imageKey.startsWith('http')) {
      console.log('🔄 [S3Image] Image failed to load, refreshing URL for:', imageKey);
      // Rimuovi dalla cache e rigenera
      urlCache.delete(imageKey);
      loadImage();
    }
  }, [error, imageUrl, imageKey, loadImage]);

  if (loading) {
    return (
      <div style={{ 
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#666',
        fontSize: '14px'
      }}>
        📷
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div style={{ 
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        color: '#666',
        fontSize: '12px'
      }}>
        Immagine non disponibile
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      style={style}
      onError={handleImageError}
      loading="lazy" // Lazy loading nativo
      {...props}
    />
  );
};

// Pulizia periodica della cache (opzionale)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    const initialSize = urlCache.size;
    
    console.log(`🧹 [S3Image Cache] Starting cache cleanup... (current size: ${initialSize})`);
    
    for (const [key, value] of urlCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        urlCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🗑️ [S3Image Cache] Cleaned ${cleanedCount} expired URLs (new size: ${urlCache.size})`);
    } else {
      console.log(`✨ [S3Image Cache] No expired URLs to clean (size: ${urlCache.size})`);
    }
  }, 5 * 60 * 1000); // Pulizia ogni 5 minuti
}

export default S3Image;