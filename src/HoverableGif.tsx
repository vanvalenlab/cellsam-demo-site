import React, { useState, useEffect } from 'react';

interface HoverableGifProps {
  staticImage: string;
  animatedGif: string;
  duration?: number; // Optional, default to 3000 milliseconds
}

function HoverableGif({ staticImage, animatedGif, duration = 3000 }: HoverableGifProps) {
  const [imageSrc, setImageSrc] = useState<string>(animatedGif);
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);

  useEffect(() => {
    // Switch to the static image after the first play
    const timer = setTimeout(() => {
      setImageSrc(staticImage);
      setHasPlayed(true);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, staticImage]);

  const handleMouseEnter = () => {
    // On hover, if it has played once, show the animated GIF
    if (hasPlayed) {
      setImageSrc(animatedGif);
    }
  };

  const handleMouseLeave = () => {
    // Revert back to the static image on mouse leave
    setImageSrc(staticImage);
  };

  return (
    <img
      src={imageSrc}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      alt="Demo"
    />
  );
}

export default HoverableGif;
