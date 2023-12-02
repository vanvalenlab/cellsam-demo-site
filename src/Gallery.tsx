import React from "react";

const images = [
  { src: "tissuenet.png", alt: "TissueNet", download: "tissuenet.png" },
  { src: "ep_micro.png", alt: "Phase microscopy", download: "ep_micro.png" },
  { src: "YeaZ.png", alt: "YeaZ", download: "YeaZ.png" },
  { src: "YeastNet.png", alt: "YeastNet", download: "YeastNet.png" },
  // Add more images as needed
];

function Gallery() {
  return (
    <section className="sample-data-section">
      {/* <h2 className="section-title">Download Sample Data</h2> */}
      <div className="gallery">
        {images.map((image, index) => (
          <a
            key={index}
            href={image.download}
            download
            className="gallery-item"
          >
            <img src={image.src} alt={image.alt} className="gallery-image" />
          </a>
        ))}
      </div>
    </section>
  );
}

export default Gallery;
