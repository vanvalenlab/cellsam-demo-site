import React, { useState, useEffect } from 'react';

interface HoverableGifProps {
  staticImage: string;
  animatedGif: string;
  duration?: number; // duration is optional and defaults to 3000
}

function HoverableGif({ staticImage, animatedGif, duration = 3000 }: HoverableGifProps) {
  const [imageSrc, setImageSrc] = useState<string>(animatedGif);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setImageSrc(staticImage);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, staticImage, animatedGif]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    setImageSrc(animatedGif);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (!isHovering) {
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
