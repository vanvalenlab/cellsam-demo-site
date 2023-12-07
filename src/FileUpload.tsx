import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  CSSProperties,
  DragEvent,
  ChangeEvent,
} from "react";
import JSZip from "jszip";
import Notification from "./Notification";
import ImageCanvas, { BoundingBox } from "./ImageCanvas"; // Import ImageCanvas and BoundingBox type

// ... other necessary imports ...

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

interface IconProps {
  className?: string;
}

interface IconProps {
  className?: string;
}

const spinnerStyle: React.CSSProperties = {
  display: "inline-block",
  width: "20px",
  height: "20px",
  border: "3px solid rgba(195, 195, 195, 0.6)",
  borderRadius: "50%",
  borderTopColor: "#636767",
  animation: "spin 1s ease-in-out infinite",
  margin: "10px auto",
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
  const fileInputRef = useRef<HTMLInputElement>(null); // Specify the type here
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [segmentationMask, setSegmentationMask] = useState<string | null>(null);
  // In FileUpload component
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  // Checkbox change handler

  const handleCheckboxChange = () => {
    setShowBoundingBoxes(!showBoundingBoxes);
  };

  const handleBoundingBoxesChange = (boxes: BoundingBox[]) => {
    setBoundingBoxes(boxes);
  };

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

  const handleFiles = useCallback(
    (files: FileList) => {
      const file = files[0];
      setOverlayImage(null);
      setOverlayMask(null);
      setIsLoading(false);
      setErrorMessage(null);

      if (uploadedImageFile) {
        URL.revokeObjectURL(URL.createObjectURL(uploadedImageFile));
      }

      setUploadedImageFile(file);
    },
    [uploadedImageFile]
  );

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

  const embedImage = async () => {
    if (!uploadedImageFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image_file", uploadedImageFile); // append the file directly, not as a binary string

      const response = await fetch(
        /*"https://fastapi-bgmt2kuix.brevlab.com/process_image/",*/
        "http://131.215.2.187:8000/embed_image/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        console.log(response);
        const blob = await response.blob();
        JSZip.loadAsync(blob).then((zip) => {
          const bboxFile = zip.file("bounding_boxes.json");
          if (bboxFile) {
            bboxFile.async("string").then((bboxString) => {
              const bboxJson = JSON.parse(bboxString);
              console.log(boundingBoxes);
              setBoundingBoxes(bboxJson);
            });
          }
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

  const processImage = async () => {
    if (!uploadedImageFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image_file", uploadedImageFile); // append the file directly, not as a binary string
      formData.append("embedding_file", "");
      formData.append("bounding_boxes", JSON.stringify(boundingBoxes));

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
          const maskFile = zip.file("segmentation_mask.png");
          Object.keys(zip.files).forEach((filename) => {
            if (maskFile) {
              maskFile.async("blob").then((maskBlob) => {
                const maskUrl = URL.createObjectURL(maskBlob);
                setSegmentationMask(maskUrl);
              });
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
    setOverlayMask(null);
    setIsLoading(false);
    setErrorMessage(null);
    setSegmentationMask(null);

    // Reset the file input
    setBoundingBoxes([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearBoundingBoxes = () => {
    setBoundingBoxes([]);
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
          ref={fileInputRef} // Add this line
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
        <>
          <div className="flex flex-row justify-center items-center">
            <button
              onClick={handleCheckboxChange}
              className="button-base toggle-button"
            >
              {showBoundingBoxes ? "Hide Boxes" : "Show Boxes"}
            </button>

            <button onClick={clearState} className="button-base clear-button">
              Clear
            </button>

            <button
              onClick={embedImage}
              className="button-base find-boxes-button"
              disabled={isLoading}
            >
              Find boxes
            </button>

            <button
              onClick={processImage}
              className="button-base process-image-button"
              disabled={isLoading}
            >
              Process Image
            </button>
          </div>

          <div className="flex flex-row justify-center items-center">
            <div className="flex flex-col pt-5">
              {renderSpinner()} {/* Render the spinner */}
              {/* Update this condition to check both uploadedImageFile and overlayImage */}
              <p className="ml-5 text-lg font-semibold">
                {overlayImage ? "Processed Image" : "Input Image"}
              </p>
              <div className="relative w-[fit-content] max-w-[90%] max-h-[70vh] overflow-auto flex justify-center items-center">
                {uploadedImageFile && (
                  <ImageCanvas
                    boundingBoxes={boundingBoxes}
                    imageSrc={URL.createObjectURL(uploadedImageFile)}
                    onBoundingBoxesChange={handleBoundingBoxesChange}
                    segmentationMaskSrc={segmentationMask} // Pass the segmentation mask URL
                    showBoundingBoxes={showBoundingBoxes} // Pass this prop to ImageCanvas
                  />
                )}

                <button
                  onClick={() => {
                    // Check if overlayImage is available; otherwise, check if uploadedImageFile is not null before calling createObjectURL
                    const imageSrc = overlayImage
                      ? overlayImage
                      : uploadedImageFile
                      ? URL.createObjectURL(uploadedImageFile)
                      : null;
                    if (imageSrc) {
                      downloadImage(imageSrc);
                    }
                  }}
                  className="absolute top-2 right-2 bg-white p-2 rounded text-black hover:bg-gray-100 w-10 h-10 flex justify-center items-center"
                >
                  <DownloadIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FileUpload;
