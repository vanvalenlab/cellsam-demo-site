import React from "react";
import FileUpload from "./FileUpload";
import Header from "./Header";
import DownloadButton from "./Download";
import Gallery from "./Gallery";

function App() {
  return (
    <div className="bg-gray-100 font-sans leading-normal tracking-normal">
      <Header />

      <main className="container mx-auto p-8">
        <section className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-gray-800">CellSAM</h1>
        </section>

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

        {/* <section
          className="bg-white p-8 rounded-lg shadow-xl text-center"
          style={{
            maxWidth: "700px",
            margin: "0 auto 40px auto",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          }}
        > */}
        <div
          className={`${
            // ? `bg-white dark:bg-zinc-900 dark:text-slate-400 rounded-md px-4 py-4 w-full shadow ring-1 ring-black ring-opacity-5 md:rounded-md ${props.className}`
            `bg-gray rounded-md px-4 py-4 border border-gray-500 max-w-[700px] w-full m-auto mt-4`
          }`}
        >
          <div>
            {/* content here */}
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Image Upload Guidelines
            </h3>
            <div
              className="mt-4 text-left"
              style={{
                fontSize: "18px",
                fontFamily: "Helvetica Neue, sans-serif",
                color: "#333",
                textIndent: "20px",
              }}
            >
              <ul className="list-disc list-inside pl-6">
                <li>Images should be in PNG format, and be less than 1024 pixels along each axis.</li>
                <li>
                  Acceptable channels: single channel, 2 channel (nuclear and
                  whole cell), or 3 channel (blank, nuclear, and whole cell).
                </li>
                <li>
                  Other formats or channel configurations will throw an error.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="rounded-md px-4 py-4 border border-gray-500 max-w-[700px] w-full m-auto mt-4"
        >
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Download Sample Data
          </h3>
          <Gallery />
        </div>
      </div>


        {/* </section> */}
      </main>
    </div>
  );
}

export default App;
