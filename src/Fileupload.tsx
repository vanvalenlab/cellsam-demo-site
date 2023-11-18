import React, { useCallback, useState } from "react";

const FileUpload = () => {
  const [highlight, setHighlight] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlight(false);
    let files = e.dataTransfer.files;
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files) => {
    // Process files here
    console.log(files);
  }, []);

  return (
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
        onChange={(e) => handleFiles(e.target.files)}
      />
      <label htmlFor="fileElem" className="cursor-pointer">
        <p className="text-gray-700">drag and drop or click to browse</p>
        <p className="text-lg font-semibold">upload file</p>
      </label>
    </div>
  );
};

export default FileUpload;
