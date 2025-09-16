import React, { useCallback, useState, useRef } from "react";
import JSZip from "jszip";
import Notification from "./Notification";
import ImageCanvas, { BoundingBox } from "./ImageCanvas"; // Import ImageCanvas and BoundingBox type
import LoadGalleryModal from "./LoadGalleryModal";

import axios from "axios";
import { walkUpBindingElementsAndPatterns } from "typescript";

//
// ... other necessary imports ...
// Use this endpoint
const endpoint = "http://localhost:8002";
// const endpoint = "https://valen-cs-r2ocj3un5.brevlab.com";


function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

interface IconProps {
  className?: string;
}

type ChannelType = "wholecell" | "nuclear" | "blank";
const channelOptions: ChannelType[] = ["wholecell", "nuclear", "blank"];

interface ChannelButtonProps {
  channelIndex: number;
  channelType: ChannelType;
  setChannelType: (channelIndex: number, type: ChannelType) => void;
}

const ChannelSelectionDropdown: React.FC<ChannelButtonProps> = ({
  channelIndex,
  channelType,
  setChannelType,
}) => {
  return (
    <select
      value={channelType}
      onChange={(e) =>
        setChannelType(channelIndex, e.target.value as ChannelType)
      }
      className={`channel-dropdown channel-${channelType}`}
    >
      {channelOptions.map((option) => (
        <option key={option} value={option}>
          {capitalize(option)}
        </option>
      ))}
    </select>
  );
};

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

const ChannelButton: React.FC<ChannelButtonProps> = ({
  channelIndex,
  channelType,
  setChannelType,
}) => {
  const cycleChannelType = () => {
    const currentIndex = channelOptions.indexOf(channelType);
    const nextIndex = (currentIndex + 1) % channelOptions.length;
    setChannelType(channelIndex, channelOptions[nextIndex]);
  };

  // Determine the CSS class based on the channel type
  const buttonClass = `channel-button channel-${channelType}`;

  return (
    <button onClick={cycleChannelType} className={buttonClass}>
      {capitalize(channelType)}
    </button>
  );
};

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
  const [maskFileObject, setMaskFileObject] = useState<File | Blob | null>(
    null
  );
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [channelSelections, setChannelSelections] = useState<ChannelType[]>([]);

  const handleImageSelection = async (imageSrc: string) => {
    try {
      const response = await fetch(imageSrc);
      const imageBlob = await response.blob();

      // Create a file from the blob
      const imageFile = new File([imageBlob], "selectedImage.png", {
        type: imageBlob.type,
      });

      // Simulate a FileList object
      const simulatedFileList = {
        0: imageFile,
        length: 1,
        item: (index: number) => imageFile,
      } as unknown as FileList; // Type assertion here LOL

      // Use the handleFiles function
      setShowGalleryModal(false);
      // hack -- just need this to work for one file list. I am on a flight and need a quick patch
      if (imageSrc == "tissuenet.png") {
        const prespecifiedChannels: ChannelType[] = ['blank', 'nuclear', 'wholecell'];
        handleFiles(simulatedFileList, prespecifiedChannels);
      } else {
        handleFiles(simulatedFileList);
      }
      
    } catch (error) {
      console.error("Error fetching selected image:", error);
      // Handle the error appropriately
    }
  };

  // handling channel stuff

  const setChannelType = (channelIndex: number, type: ChannelType) => {
    const newSelections: ChannelType[] = [...channelSelections];
    newSelections[channelIndex] = type;
    setChannelSelections(newSelections);
  };

  const updateFormData = (formData: FormData) => {
    // Serialize the channelSelections array into a JSON string
    const channelSelectionsJSON = JSON.stringify(channelSelections);

    formData.append("channel_count", channelSelections.length.toString());
    formData.append("channel_selections", channelSelectionsJSON);
  };

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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlight(false);
    let files = e.dataTransfer.files;
    handleFiles(files);
  }, []);

  const handleFiles = useCallback(
    async (files: FileList, prespecifiedChannels: ChannelType[] = []) => {
      const file = files[0];
      setOverlayImage(null);
      setOverlayMask(null);
      setIsLoading(true); // Set loading to true while processing
      setErrorMessage(null);
      setSegmentationMask(null);
      setBoundingBoxes([]);

      if (uploadedImageFile) {
        URL.revokeObjectURL(URL.createObjectURL(uploadedImageFile));
      }

      setUploadedImageFile(file);

      // Prepare FormData to send to the backend
      const formData = new FormData();
      formData.append("image_file", file);

      try {
        const response = await fetch(endpoint + "/image_channels/", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();

        if (prespecifiedChannels.length > 0) {
          setChannelSelections(prespecifiedChannels);
        } else {
          if (data.channels) {
            setChannelSelections(
              new Array(data.channels).fill(channelOptions[0]) as ChannelType[]
            );
          } else {
            // Handle unknown or unsupported image formats
            setErrorMessage(
              "Error processing image, channels not found. You may have an invalid format."
            ); // Display error message
            clearState();
          }
        }
      } catch (error) {
        setErrorMessage(
          "Error processing image. You may have an invalid format. " + error
        ); // Display error message
        clearState();
      } finally {
        setIsLoading(false); // Reset loading state
      }
    },
    [uploadedImageFile]
  );

  const downloadImage = (imageSrc: string, returnedImage?: boolean) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = "mask.tiff"; // Set the download file name

    if (returnedImage) {
      link.download = "downloaded_mask.tiff"; // Set the extension directly
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
      updateFormData(formData);

      const response = await fetch(endpoint + "/embed_image/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        JSZip.loadAsync(blob).then((zip) => {
          const bboxFile = zip.file("bounding_boxes.json");
          if (bboxFile) {
            bboxFile.async("string").then((bboxString) => {
              const bboxJson = JSON.parse(bboxString);
              setBoundingBoxes(bboxJson);
              handleCheckboxChange();
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
    setShowBoundingBoxes(true);
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
      updateFormData(formData);

      const response = await fetch(
        /*"https://fastapi-bgmt2kuix.brevlab.com/process_image/",*/
        endpoint + "/process_image/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        JSZip.loadAsync(blob).then((zip) => {
          const maskFile = zip.file("segmentation_mask.png");
          const maskData = zip.file("mask.tiff");
          Object.keys(zip.files).forEach((filename) => {
            if (maskFile) {
              maskFile.async("blob").then((maskBlob) => {
                const maskUrl = URL.createObjectURL(maskBlob);
                setSegmentationMask(maskUrl);
              });
            }
            if (maskData) {
              maskData.async("blob").then((maskBlob) => {
                const maskUrl = URL.createObjectURL(maskBlob);
                setMaskFileObject(maskBlob);
                setOverlayMask(maskUrl);
                setShowBoundingBoxes(false);
              });
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
    if (boundingBoxes.length > 0 || segmentationMask) {
      // If there are bounding boxes or a segmentation mask, clear only those
      setBoundingBoxes([]);
      setSegmentationMask(null);
      setOverlayMask(null);
      setMaskFileObject(null);
    } else {
      // If there are no bounding boxes or masks, clear the image
      setUploadedImageFile(null);
      setOverlayImage(null);
      setOverlayMask(null);
      setSegmentationMask(null);
      setChannelSelections([]);
      setMaskFileObject(null);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadFilesToDCL = async () => {
    if (!uploadedImageFile || !maskFileObject) return;

    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append("image_file", uploadedImageFile); // append the file directly, not as a binary string
      formData.append("mask_file", maskFileObject);

      const response = await fetch(endpoint + "/upload_files/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageBlobName = data.image_blob_name;
        const maskBlobName = data.mask_blob_name;

        var formDataDCL = new FormData();
        formDataDCL.append("images", imageBlobName);
        formDataDCL.append("labels", maskBlobName);
        formDataDCL.append("axes", "YXC");

        const baseUrl = "https://label.deepcell.org";
        axios({
          method: "post",
          url: baseUrl + "/api/project",
          data: formDataDCL,
          headers: { "Content-Type": "multipart/form-data" },
        })
          .then((res) => {
            // Open the response URL in a new tab/window
            console.log(res.data);
            window.open(`${baseUrl}/project?projectId=${res.data}`, "_blank");
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        const errorText = await response.text();
        console.error("Error passing data to DeepCell.", errorText);
        setErrorMessage(errorText);
      }
    } catch (error) {
      setErrorMessage(`Error passing data to DeepCell: ${error}`);
    }

    setIsLoading(false);
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

      <label htmlFor="fileElem" className="cursor-pointer">
        <div
          id="drop-area"
          className={`mb-4 border-2 border-dotted border-gray-300 ${
            highlight ? "bg-gray-100" : "bg-white"
          } p-6 text-center hover:border-blue-500 hover:shadow-md transition-all duration-300`}
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
            accept="image/*, image/tiff"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files) {
                handleFiles(e.target.files);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center">
            {/* <img src="upload_icon.svg" alt="Upload" className="h-8 w-8 mb-2" /> */}
            <p className="text-xl font-light text-gray-800">Upload File</p>
            <p className="text-sm text-gray-500 mt-2">
              Drag and drop, or click to browse
            </p>
          </div>

          <button
            type="button"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full shadow transition-transform duration-300 hover:-translate-y-1"
            onClick={() => setShowGalleryModal(true)}
          >
            Open Gallery
          </button>
        </div>
      </label>

      {/* GalleryModal component */}
      <LoadGalleryModal
        show={showGalleryModal}
        setShow={setShowGalleryModal}
        onImageSelect={handleImageSelection} // Pass the handler function
      />
      <div className="channel-selection">
        {channelSelections.map((type, index) => (
          <ChannelSelectionDropdown
            key={index}
            channelIndex={index}
            channelType={type}
            setChannelType={setChannelType}
          />
        ))}
      </div>

      {(uploadedImageFile || overlayImage) && (
        <>
          <div className="flex flex-row justify-center items-center">
            <div className="flex flex-col pt-5 max-w-[80%]"> {/* max width prevents overlfow, but zooms in. */}
              {renderSpinner()} {/* Render the spinner */}
              {/* Update this condition to check both uploadedImageFile and overlayImage */}
              <div className="relative w-[fit-content] max-w-[100%] max-h-[70vh] overflow-auto flex justify-center items-center">
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
                    if (overlayMask) {
                      downloadImage(overlayMask);
                    }
                  }}
                  disabled={!overlayMask}
                  className={`absolute top-2 right-2 left-2 bg-white p-2 rounded text-black hover:bg-gray-100 w-10 h-10 flex justify-center items-center ${
                    !overlayMask ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <DownloadIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <>
            <div
              className="flex flex-row justify-center items-center"
              style={{ marginTop: "20px" }}
            >
              <button onClick={clearState} className="button-base clear-button">
                Clear
              </button>
              <button
                onClick={handleCheckboxChange}
                className="button-base toggle-button"
              >
                {showBoundingBoxes ? "Hide Boxes" : "Show Boxes"}
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
                Compute Mask
              </button>
              <button
                onClick={uploadFilesToDCL}
                className="button-base dcl-upload-button"
                disabled={isLoading || !maskFileObject}
              >
                Open in DCL
              </button>
            </div>
          </>
        </>
      )}
    </div>
  );
};

export default FileUpload;
