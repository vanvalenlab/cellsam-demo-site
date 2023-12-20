import React, { useRef, useEffect, MouseEvent } from "react";
import Gallery from "./Gallery";

interface LoadGalleryModalProps {
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  onImageSelect: (imageSrc: string) => void;
}


const LoadGalleryModal: React.FC<LoadGalleryModalProps> = ({ show, setShow, onImageSelect }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const closeModal = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setShow(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", closeModal as any);
    return () => document.removeEventListener("mousedown", closeModal as any);
  }, []);

  // Only render the modal if 'show' is true
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded" ref={modalRef}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Select an Image
        </h3>
        <Gallery onImageClick={onImageSelect} />
        <button
          onClick={() => setShow(false)}
          className="mt-4 bg-red-500 hover:bg-red-800 text-white font-bold py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LoadGalleryModal;
