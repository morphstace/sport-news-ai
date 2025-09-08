import React, { useState, useEffect, useCallback } from 'react';
import { getUrl } from 'aws-amplify/storage';

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
      
      if (imageKey.startsWith('http')) {
        setImageUrl(imageKey);
        setLoading(false);
        return;
      }

      const cached = urlCache.get(imageKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        const remainingTime = Math.round((CACHE_DURATION - (now - cached.timestamp)) / 1000 / 60);
        setImageUrl(cached.url);
        setLoading(false);
        return;
      }

      const urlResult = await getUrl({
        key: imageKey,
        options: {
          accessLevel: 'guest',
          validateObjectExistence: false
        }
      });

      const newUrl = urlResult.url.toString();
      
      urlCache.set(imageKey, {
        url: newUrl,
        timestamp: now
      });

      setImageUrl(newUrl);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [imageKey]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  const handleImageError = useCallback(() => {
    if (!error && imageUrl && !imageKey.startsWith('http')) {
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

if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    const initialSize = urlCache.size;
    
    
    for (const [key, value] of urlCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        urlCache.delete(key);
        cleanedCount++;
      }
    }
  }, 5 * 60 * 1000); // Pulizia ogni 5 minuti
}

export default S3Image;