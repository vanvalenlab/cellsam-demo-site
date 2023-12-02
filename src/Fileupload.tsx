import React, { useCallback, useState, useEffect } from "react";
import JSZip from 'jszip';

const FileUpload = () => {
  const [highlight, setHighlight] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    console.log("overlayImage updated:", overlayImage);
  }, [overlayImage]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlight(false);
    let files = e.dataTransfer.files;
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    setUploadedImageFile(file);
    processImage(file);
  }, []);

  const processImage = async (imageFile: File) => {
    try {
      const formData = new FormData();
      formData.append('image_file', imageFile); // append the file directly, not as a binary string
      formData.append('embedding_file', '');
      formData.append('bounding_boxes', '');

      const response = await fetch('https://fastapi-bgmt2kuix.brevlab.com/process_image/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        JSZip.loadAsync(blob).then(zip => {
          Object.keys(zip.files).forEach(filename => {
            if (filename.endsWith('.png')) {
              // Found the PNG file, process it
              const file = zip.file(filename);
              if (file) {
                file.async('blob').then(pngBlob => {
                  const imageUrl = URL.createObjectURL(pngBlob);
                  setOverlayImage(imageUrl); // Assuming setOverlayImage is your state setter
                });
              }
            }
          });
        });
        } else {
        const errorText = await response.text();
        console.error('Error response from server:', errorText);
        throw new Error('Failed to process image: ' + errorText);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  return (
    <div>
      <div
        id="drop-area"
        className={`mb-4 border-2 border-dashed ${highlight ? "bg-blue-100" : ""} p-4 text-center cursor-pointer`}
        onDragEnter={handleDrag}
        onDragOver={(e) => {
          handleDrag(e);
          setHighlight(true);
        }}
        onDragLeave={(e) => {
          handleDrag(e);
          setHighlight(false);
        }}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileElem"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
          }}
        />
        <label htmlFor="fileElem" className="cursor-pointer">
          <p className="text-gray-700">Drag and drop or click to browse</p>
          <p className="text-lg font-semibold">Upload file</p>
        </label>
      </div>
      {uploadedImageFile && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh', // Adjust the height of the container as needed
          width: '100%',  // Ensure the container takes the full width
          paddingTop: '20px' // Space at the top
        }}>
          <div style={{
            position: "relative",
            width: "fit-content",
            maxWidth: '90%',  // Maximum width for the image container
            maxHeight: '70vh',  // Maximum height for the image container
            overflow: 'auto'  // Allows scrolling if the image is larger than the container
          }}>
            <img
              src={URL.createObjectURL(uploadedImageFile)}
              alt="Uploaded"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'  // Resizes the image to fit within the container
              }}
            />
          </div>
        </div>
      )}
      {overlayImage && (
        <div>
          <img src={overlayImage} alt="Overlay" onError={() => console.log('Error loading image')} />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
