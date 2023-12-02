import React from "react";

const images = [
  { src: "omnipose.png", alt: "Omnipose", download: "omnipose.png" },
  { src: "ep_micro.png", alt: "Phase microscopy", download: "ep_micro.png" },
  { src: "yeaZ.png", alt: "YeaZ", download: "YeaZ.png" },
  { src: "yeastnet.png", alt: "YeastNet", download: "yeastnet.png" },
  // Add more images as needed
];

function Gallery() {
  return (
    <section className="sample-data-section">
      <h2 className="section-title">Download Sample Data</h2>
      <div className="gallery">
        {images.map((image, index) => (
          <a key={index} href={image.download} download className="gallery-item">
            <img src={image.src} alt={image.alt} className="gallery-image" />
          </a>
        ))}
      </div>
    </section>
  );
}

export default Gallery;
