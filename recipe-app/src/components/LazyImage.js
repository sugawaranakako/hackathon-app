import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ src, alt, className, style, placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='0.3em' fill='%23999' font-family='sans-serif'%3E読み込み中...%3C/text%3E%3C/svg%3E" }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      {
        rootMargin: '50px', // 50px手前で読み込み開始
        threshold: 0.1
      }
    );

    observer.observe(img);

    return () => {
      if (img) observer.unobserve(img);
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imgSrc = isInView ? src : placeholder;
  const displaySrc = hasError ? placeholder : imgSrc;

  return (
    <div 
      ref={imgRef}
      className={`lazy-image ${className || ''}`}
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        ...style 
      }}
    >
      <img
        src={displaySrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease',
          opacity: isLoaded ? 1 : 0.7,
          filter: isLoaded ? 'none' : 'blur(1px)'
        }}
      />
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '12px',
            color: '#999',
            pointerEvents: 'none'
          }}
        >
          📸
        </div>
      )}
    </div>
  );
};

export default React.memo(LazyImage);