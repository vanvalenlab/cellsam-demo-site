import React from 'react';

function DownloadButton() {
  const sampleDataURL = 'YeaZ_example_img.png'; // Replace with your file path

  return (
    <div className="download-button-container">
      <a href={sampleDataURL} download className="download-btn">
        <span className="button-text">Download Sample Data</span>
        {/*<span className="download-icon">🔽</span> {/* Adding a download icon */}
      </a>
    </div>
  );
}

export default DownloadButton;
