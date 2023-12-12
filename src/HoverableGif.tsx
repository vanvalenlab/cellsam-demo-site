import React, { useState, useEffect } from 'react';

interface HoverableGifProps {
  staticImage: string;
  animatedGif: string;
  duration?: number; // Duration for one loop of the GIF
}

function HoverableGif({ staticImage, animatedGif, duration = 3000 }: HoverableGifProps) {
  const [imageSrc, setImageSrc] = useState<string>(animatedGif);
  const [playCount, setPlayCount] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (playCount < 3) {
      // Set a timer to switch back to the animated GIF after one loop
      timer = setTimeout(() => {
        setImageSrc(playCount < 2 ? animatedGif : staticImage); // Play the GIF 3 times
        setPlayCount(playCount + 1);
      }, duration);
    }

    return () => clearTimeout(timer);
  }, [playCount, duration]);

  const handleMouseEnter = () => {
    // On hover, restart the play count and show the animated GIF
    if (playCount >= 4) {
      setPlayCount(0);
      setImageSrc(animatedGif);
    }
  };

  const handleMouseLeave = () => {
    // If the GIF has played less than 3 times, continue playing
    if (playCount < 4) {
      setImageSrc(animatedGif);
    } else {
      // If the GIF has played 3 times, show static image
      setImageSrc(staticImage);
    }
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
