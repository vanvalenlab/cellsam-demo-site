import React, { useState } from "react";
import FileUpload from "./FileUpload";
import Header from "./Header";
import GalleryModal from "./GalleryModal";
import HoverableGif from "./HoverableGif";

import usageStaticImage from './assets/usage.png';
import usageAnimatedGif from './assets/usage_fast.gif';
import usageDropdownStaticImage from './assets/usage_dropdown.png';
import usageDropdownAnimatedGif from './assets/usage_dropdown_fast.gif';

import boxStaticImage from './assets/boxes.png';
import boxAnimatedGif from './assets/boxes_fast.gif';

function App() {
  const [showGallery, setShowGallery] = useState(false);

  return (
    <div className="bg-gray-100 font-sans leading-normal tracking-normal">
      <Header />

      <main className="container mx-auto p-8 flex">
        {/* Guidelines Column */}
        <aside className="w-1/3 mr-8">
          <div className="bg-gray-200 rounded-lg p-6 border border-gray-400 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Quickstart
              <span className="text-sm text-gray-600 ml-2">(Hover to play!)</span>
            </h3>

            <ul className="space-y-4 text-gray-700">
              <li>
                Images should be in channel-last format and be less than 1024 pixels along each axis.
              </li>
              <li>
                After uploading, select whether each image channel is nuclear, wholecell, or blank.
                <div className="mt-2">
                  <HoverableGif staticImage={usageDropdownStaticImage} animatedGif={usageDropdownAnimatedGif}/>
                </div>
              </li>
              <li>
                Generate bounding box prompts by clicking Find Boxes. Delete boxes by selecting them and pressing delete. Add a box by holding Shift and dragging. Scroll to Zoom in and out.
                <div className="mt-2">
                  <HoverableGif staticImage={boxStaticImage} animatedGif={boxAnimatedGif}/>
                </div>
              </li>
              <li>
                Once you're satisfied with the boxes, click on the Compute Mask button to generate a mask for each box. The computed mask is available for download as a <code>.tiff</code> file.
              </li>
              <li>
                Click Clear once to remove all boxes and masks. Click Clear twice to remove the uploaded image.
              </li>
              <li>
                Other formats or channel configurations will throw an error.
              </li>
            </ul>
            <button
              onClick={() => setShowGallery(true)}
              className="mt-6 py-2 px-4 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition-colors"
            >
              View Sample Data
            </button>
            

            <GalleryModal show={showGallery} setShow={setShowGallery} />

          </div>
        </aside>

        {/* Main Column */}
        <section className="w-2/3">
          {/* <section className="mb-12 text-center"> */}
          {/* <h1 className="text-5xl font-bold text-gray-800">CellSAM</h1> */}
          {/* </section> */}

          <section
            className="bg-white mb-20 p-8 rounded-lg shadow-xl text-center"
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            <FileUpload />

            <p
              style={{
                fontSize: "20px",
                fontFamily: "Helvetica Neue, sans-serif",
                color: "#333",
                lineHeight: "1.8",
                marginTop: "20px",
              }}
            >
              <strong style={{ fontSize: "22px", color: "#2A2A2A" }}>
                CellSAM
              </strong>{" "}
              is a foundation model for cell segmentation trained on a diverse
              range of cells and data types. Discover more in the{" "}
              <a
                href="https://www.biorxiv.org/content/10.1101/2023.11.17.567630v2.full.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#4A90E2",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                preprint{" "}
              </a>
              and try out CellSAM above! CellSAM is proudly hosted by{" "}
              <a
                href="https://brev.dev"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#4A90E2",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Brev.dev
              </a>{" "}
              and is a part of the
              <a
                href="https://deepcell.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#4A90E2",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                {" "}
                DeepCell ecosystem
              </a>
              .
            </p>
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;
