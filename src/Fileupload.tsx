import React, { useCallback, useState, useEffect } from "react";
import JSZip from "jszip";

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

interface IconProps {
  className?: string;
}

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

  const downloadImage = (imageSrc: string, returnedImage?: boolean) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = "downloaded_image"; // Set the download file name

    if (returnedImage) {
      link.download = "downloaded_image.png"; // Set the extension directly
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processImage = async (imageFile: File) => {
    try {
      const formData = new FormData();
      formData.append("image_file", imageFile); // append the file directly, not as a binary string
      formData.append("embedding_file", "");
      formData.append("bounding_boxes", "");

      const response = await fetch(
        "https://fastapi-bgmt2kuix.brevlab.com/process_image/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
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
            }
          });
        });
      } else {
        const errorText = await response.text();
        console.error("Error response from server:", errorText);
        throw new Error("Failed to process image: " + errorText);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  };

  return (
    <div>
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
      <div className="flex flex-row justify-center items-center">
        {uploadedImageFile && (
          <div className="flex flex-col pt-5">
            <p className="ml-5 text-lg font-semibold">Your image</p>

            <div className="flex justify-center items-center w-full">
              <div className="relative w-[fit-content] max-w-[90%] max-h-[70vh] overflow-auto">
                <img
                  src={URL.createObjectURL(uploadedImageFile)}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  onClick={() =>
                    downloadImage(URL.createObjectURL(uploadedImageFile))
                  }
                  className="absolute top-2 right-2 bg-white p-2 rounded text-black hover:bg-gray-100 w-10 h-10 flex justify-center items-center"
                >
                  <DownloadIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
        {overlayImage && (
          <div className="flex flex-col pt-5">
            <p className="ml-5 text-lg font-semibold">The result</p>

            <div className="flex justify-center items-center w-full">
              <div className="relative w-[fit-content] max-w-[90%] max-h-[70vh] overflow-auto">
                <img
                  src={overlayImage}
                  alt="Overlay"
                  className="max-w-full max-h-full object-contain"
                />
                <button
                  onClick={() => downloadImage(overlayImage, true)}
                  className="absolute top-2 right-2 bg-white p-2 rounded text-black hover:bg-gray-100 w-10 h-10 flex justify-center items-center"
                >
                  <DownloadIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
