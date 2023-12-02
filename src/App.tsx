import React from "react";
import FileUpload from "./Fileupload";
import Header from "./Header";

function App() {
  return (
    <div className="bg-gray-100 font-sans leading-normal tracking-normal">
      <Header />

      <main className="container mx-auto p-8">
        <section className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800">CellSAM</h1>
          <a
            href="https://github.com"
            className="text-lg text-gray-700 hover:text-blue-600 transition duration-300 ease-in-out"
            aria-label="Visit GitHub Repository"
          >
            GitHub
          </a>
        </section>

        <section className="bg-white p-8 rounded-lg shadow-xl text-center" style={{ maxWidth: '700px', margin: '0 auto', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <FileUpload />

          <p style={{ fontSize: '20px', fontFamily: 'Helvetica Neue, sans-serif', color: '#333', lineHeight: '1.8', marginTop: '20px' }}>
            <strong style={{ fontSize: '22px', color: '#2A2A2A' }}>CellSAM</strong> is a cutting-edge foundation model trained on a diverse range of cells and data types for cell segmentation.
            Discover more in the <a href="https://www.biorxiv.org/content/10.1101/2023.11.17.567630v2.full.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#4A90E2', textDecoration: 'none', fontWeight: 'bold' }}>preprint</a>  
            and try out CellSAM above! CellSAM is proudly hosted by <a href="https://brev.dev" target="_blank" rel="noopener noreferrer" style={{ color: '#4A90E2', textDecoration: 'none', fontWeight: 'bold' }}>Brev.dev</a> and is a part of the 
            <a href="https://deepcell.org" target="_blank" rel="noopener noreferrer" style={{ color: '#4A90E2', textDecoration: 'none', fontWeight: 'bold' }}> DeepCell ecosystem</a>.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
