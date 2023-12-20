import React from "react";

// Define the props interface
interface GalleryProps {
  onImageClick: (imageSrc: string) => void; // Type for the onImageClick function
}

const images = [
  { src: "tissuenet.png", alt: "TissueNet", download: "tissuenet.png" },
  { src: "ep_micro.png", alt: "Phase microscopy", download: "ep_micro.png" },
  { src: "YeaZ.png", alt: "YeaZ", download: "YeaZ.png" },
  { src: "YeastNet.png", alt: "YeastNet", download: "YeastNet.png" },
  // Add more images as needed
];
const Gallery: React.FC<GalleryProps> = ({ onImageClick }) => {
  return (
    <section className="sample-data-section">
      <div className="gallery">
        {images.map((image, index) => (
          <div
            key={index}
            className="gallery-item"
            onClick={() => onImageClick(image.src)}
          >
            <img src={image.src} alt={image.alt} className="gallery-image" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default Gallery;
