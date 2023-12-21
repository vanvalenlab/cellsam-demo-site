import React from "react";

// Define the props interface
interface GalleryProps {
  onImageClick?: (imageSrc: string) => void;
  downloadMode?: boolean;
}

const images = [
  { src: "tissuenet.png", alt: "TissueNet", download: "tissuenet.png" },
  { src: "ep_micro.png", alt: "Phase microscopy", download: "ep_micro.png" },
  { src: "YeaZ.png", alt: "YeaZ", download: "YeaZ.png" },
  { src: "YeastNet.png", alt: "YeastNet", download: "YeastNet.png" },
  // Add more images as needed
];
const Gallery: React.FC<GalleryProps> = ({ onImageClick, downloadMode = false }) => {
  const handleImageClick = (imageSrc: string, imageAlt: string) => {
    if (downloadMode) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = imageAlt; // Using image alt text as the download filename
      document.body.appendChild(link); // Append to body
      link.click(); // Trigger the download
      document.body.removeChild(link); // Remove the link from the body
    } else if (onImageClick) {
      // Call the onImageClick prop function
      onImageClick(imageSrc);
    }
  };

  return (
    <section className="sample-data-section">
      <div className="gallery">
        {images.map((image, index) => (
          <div
            key={index}
            className="gallery-item"
            onClick={() => handleImageClick(image.src, image.alt)}
          >
            <img src={image.src} alt={image.alt} className="gallery-image" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default Gallery;