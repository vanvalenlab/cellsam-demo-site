import React, { useState, useEffect } from 'react';

interface HoverableGifProps {
  staticImage: string;
  animatedGif: string;
  duration?: number; // Duration for one loop of the GIF
}

function HoverableGif({ staticImage, animatedGif, duration = 20000 }: HoverableGifProps) {
  const [imageSrc, setImageSrc] = useState<string>(animatedGif);
  const [playCount, setPlayCount] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (playCount < 3) {
      // Set a timer to switch back to the static image after one loop
      timer = setTimeout(() => {
        setImageSrc(staticImage);
      }, duration);
    }

    return () => clearTimeout(timer);
  }, [playCount, duration, staticImage]);

  useEffect(() => {
    if (playCount < 3) {
      // Increment play count and set the animated GIF
      setPlayCount(playCount + 1);
      setImageSrc(animatedGif);
    }
  }, []);

  const handleMouseEnter = () => {
    // On hover, show the animated GIF if play count is less than 3
    if (playCount < 3) {
      setImageSrc(animatedGif);
    }
  };

  const handleMouseLeave = () => {
    // On mouse leave, switch back to the static image
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
