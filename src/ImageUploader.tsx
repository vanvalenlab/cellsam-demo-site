import React, { useState } from 'react';
import axios from 'axios';

const ImageUploader: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('image_file', file);

      try {
        const response = await axios.post('http://131.215.2.187:8000/process_image/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Assuming the response contains the processed image as a direct link
        setProcessedImage(response.data);

        // Create a URL for the uploaded image to display
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <div style={{ position: 'relative' }}>
        {processedImage && <img src={processedImage} alt="Processed" style={{ width: '100%' }} />}
        {uploadedImage && <img src={uploadedImage} alt="Uploaded" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.5, width: '100%' }} />}
      </div>
    </div>
  );
};

export default ImageUploader;
