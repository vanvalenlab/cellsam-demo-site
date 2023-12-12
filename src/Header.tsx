import React from "react";

export default function Header() {
  return (
    <header className="bg-material-ui-blue shadow-md">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6"
        aria-label="Global"
      >
        <div>
          <a
            href="https://cellsam.deepcell.org"
            className="text-xl md:text-2xl font-bold text-white hover:text-blue-300 transition duration-300 ease-in-out"
          >
            CellSAM
          </a>
        </div>
        <div className="flex gap-x-8">
          <a
            href="https://vanvalen.caltech.edu/"
            className="text-lg font-semibold text-white hover:text-blue-300 transition duration-300 ease-in-out"
          >
            Van Valen Lab
          </a>
          <a
            href="https://github.com/vanvalenlab/"
            className="text-lg font-semibold text-white hover:text-blue-300 transition duration-300 ease-in-out"
          >
            GitHub
          </a>
          <a
            href="https://deepcell.org"
            className="text-lg font-semibold text-white hover:text-blue-300 transition duration-300 ease-in-out"
          >
            DeepCell
          </a>
        </div>
      </nav>
    </header>
  );
}
