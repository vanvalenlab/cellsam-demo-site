import React from "react";
import FileUpload from "./Fileupload";
import Header from "./Header";

function App() {
  return (
    <div className="bg-gray-100 font-sans leading-normal tracking-normal">
      <Header />

      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">DeepCell Label</h1>
          <a
            href="https://github.com"
            className="text-gray-700 hover:text-gray-900"
          >
            Github
          </a>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-gray-700 mb-4">
            DeepCell Label is a data labeling tool...
          </p>
          <p className="text-gray-700 mb-4">Label can work with 2D images...</p>
          <FileUpload />
        </div>
      </div>
    </div>
  );
}

export default App;
