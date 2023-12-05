import React, { CSSProperties,  useCallback, useState, useEffect } from "react";
import JSZip from "jszip";
import Notification from "./Notification";
import { error } from "console";

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

interface IconProps {
  className?: string;
}

const spinnerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '20px',
  height: '20px',
  border: '3px solid rgba(195, 195, 195, 0.6)',
  borderRadius: '50%',
  borderTopColor: '#636767',
  animation: 'spin 1s ease-in-out infinite',
  margin: '10px auto',
};

const overlayStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  opacity: 0.5,
  width: '100%',
  height: '100%',
  objectFit: 'contain' as 'contain', // Ensure the correct type is used
};


const DownloadIcon: React.FC<IconProps> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={classNames("", props.className)}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25"
      />
    </svg>
  );
};



const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" // Adjusted the text color
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="#000000" // Adjusted the fill color
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const FileUpload = () => {
  const [highlight, setHighlight] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayMask, setOverlayMask] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  



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

  const downloadImage = (imageSrc: string, returnedImage?: boolean) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = "downloaded_image"; // Set the download file name

    if (returnedImage) {
      link.download = "downloaded_mask.npy"; // Set the extension directly
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSpinner = () => {
    if (!isLoading) return null;
    return <div style={spinnerStyle}></div>;
  };

  const processImage = async (imageFile: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image_file", imageFile); // append the file directly, not as a binary string
      formData.append("embedding_file", "");
      formData.append("bounding_boxes", "");

      const response = await fetch(
        /*"https://fastapi-bgmt2kuix.brevlab.com/process_image/",*/
        "http://131.215.2.187:8000/process_image/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        console.log(response);
        const blob = await response.blob();
        JSZip.loadAsync(blob).then((zip) => {
          Object.keys(zip.files).forEach((filename) => {
            if (filename.endsWith(".png")) {
              // Found the PNG file, process it
              const file = zip.file(filename);
              if (file) {
                file.async("blob").then((pngBlob) => {
                  const imageUrl = URL.createObjectURL(pngBlob);
                  setOverlayImage(imageUrl); // Assuming setOverlayImage is your state setter
                });
              }
            } else if (filename.endsWith("mask.npy")) {
              const file = zip.file(filename);
              if (file) {
                file.async("blob").then((b) => {
                  const imageUrl = URL.createObjectURL(b);
                  setOverlayMask(imageUrl); // Assuming setOverlayImage is your state setter
                });
              }
            }
          });
        });
        setErrorMessage(null);
      } else {
        const errorText = await response.text();
        console.error("Error processing image:", errorText);
        setErrorMessage(errorText);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setErrorMessage(`Error processing image: ${error}`);
    }
    setIsLoading(false);
  };

  // Clear function
  const clearState = () => {
    setUploadedImageFile(null);
    setOverlayImage(null);
    setIsLoading(false);
    setErrorMessage(null);
  };

  return (
    <div>
      {errorMessage && (
        <Notification
          show={true}
          severity="error"
          text={errorMessage}
          className="mb-1"
          onClose={() => {
            setErrorMessage(null);
            clearState();
          }}
        />
      )}

      <div
        id="drop-area"
        className={`mb-4 border-2 border-dashed ${
          highlight ? "bg-blue-100" : ""
        } p-4 text-center cursor-pointer`}
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
      {(uploadedImageFile || overlayImage) && (
        <div className="flex flex-row justify-center items-center">
          <button
            onClick={() => {
              clearState();
            }}
            className="bg-gray-100 p-2 px-5 rounded text-black hover:bg-gray-200 flex justify-center items-center"
          >
            Clear
          </button>
        </div>
      )}
          
      <div className="flex flex-row justify-center items-center">
        <div className="flex flex-col pt-5">
          {renderSpinner()} {/* Render the spinner */}

          <p className="ml-5 text-lg font-semibold">{overlayImage ? 'Processed Image' : 'Input Image'}</p>

          <div className="relative w-[fit-content] max-w-[90%] max-h-[70vh] overflow-auto">
            <img
              src={overlayImage ? overlayImage : uploadedImageFile ? URL.createObjectURL(uploadedImageFile) : ''}
              alt={overlayImage ? 'Processed' : 'Uploaded'}
              className="max-w-full max-h-full object-contain"
            />
            {uploadedImageFile && (
              <button
                onClick={() =>
                  downloadImage(URL.createObjectURL(uploadedImageFile))
                }
                className="absolute top-2 right-2 bg-white p-2 rounded text-black hover:bg-gray-100 w-10 h-10 flex justify-center items-center"
              >
                <DownloadIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default FileUpload;
