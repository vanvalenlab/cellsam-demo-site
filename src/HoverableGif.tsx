import React, { useState } from 'react';

interface HoverableGifProps {
  staticImage: string;
  animatedGif: string;
}

function HoverableGif({ staticImage, animatedGif }: HoverableGifProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <img src={isHovering ? animatedGif : staticImage} alt="Demo" />
    </div>
  );
}

export default HoverableGif;
