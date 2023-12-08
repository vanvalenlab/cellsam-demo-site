import React, { useRef, useEffect, useState, MouseEvent } from "react";

interface ImageCanvasProps {
  imageSrc: string;
  boundingBoxes: BoundingBox[];
  onBoundingBoxesChange: (boxes: BoundingBox[]) => void;
  segmentationMaskSrc?: string | null; // optional prop for segmentation mask URL
  showBoundingBoxes?: boolean;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageSrc,
  boundingBoxes,
  onBoundingBoxesChange,
  segmentationMaskSrc, // Add this line
  showBoundingBoxes,
}) => {
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);
  const [hoveredBoxIndex, setHoveredBoxIndex] = useState<number | null>(null);
  const [lastTempRect, setLastTempRect] = useState<BoundingBox | null>(null);
  const clickTolerance = 1;
  let isBoxSelection = false; // Flag to indicate if the current action is box selection

  // A stupid solution but I think it could work?
  const underCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  const imageRef = useRef(new Image());
  const maskImageRef = useRef(new Image());

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const image = imageRef.current;
    image.onload = () => {
      const canvas = canvasRef.current;
      const underCanvas = underCanvasRef.current;
      const boxCanvas = boxCanvasRef.current;
      const context = canvas?.getContext("2d");
      const underContext = underCanvas?.getContext("2d");

      if (
        canvas &&
        context &&
        underCanvas &&
        underContext &&
        boxCanvas &&
        image.complete
      ) {
        canvas.width = image.width;
        canvas.height = image.height;

        underCanvas.width = image.width;
        underCanvas.height = image.height;

        boxCanvas.width = image.width;
        boxCanvas.height = image.height;

        context.drawImage(image, 0, 0);
        underContext.drawImage(image, 0, 0);
        drawBoxes();
        setImageSize({ width: image.width, height: image.height });
      }
    };
    image.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    const image = maskImageRef.current;
    image.onload = () => {
      const canvas = maskCanvasRef.current;
      const context = canvas?.getContext("2d");

      if (canvas && context && image.complete) {
        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);
      }
    };
    if (segmentationMaskSrc) {
      image.src = segmentationMaskSrc;
    }
  }, [segmentationMaskSrc]);

  const drawMask = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const maskImage = maskImageRef.current;

    if (canvas && context && maskImage.complete && maskImage.src) {
      context.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
    }
  };

  // const drawBoxes = () => {
  //   const canvas = boxCanvasRef.current;
  //   const context = canvas?.getContext('2d');
  //   if (canvas && context) {
  //     context.clearRect(0, 0, canvas.width, canvas.height);
  //     boundingBoxes.forEach(box => {
  //       context.beginPath();
  //       context.strokeStyle = 'red';
  //       context.lineWidth = 2;
  //       context.rect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
  //       context.stroke();
  //     });
  //   }
  // };

  const drawBoxes = () => {
    const canvas = boxCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      // drawImage(); // Redraw the image to clear previous box drawings

      // // Draw the segmentation mask
      if (segmentationMaskSrc) {
        const maskImage = maskImageRef.current;
        if (maskImage.complete && maskImage.src) {
          context.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
        }
      }

      // if (!showBoundingBoxes) return; // Don't draw boxes if showBoundingBoxes is false

      boundingBoxes.forEach((box, index) => {
        // Set the style for the hovered box
        if (index === hoveredBoxIndex) {
          context.strokeStyle = "lightcoral"; // Color for hovered box
          context.shadowColor = "red";
          context.shadowBlur = 10;
        }
        // Set the style for the selected box
        else if (index === selectedBoxIndex) {
          context.strokeStyle = "red"; // Color for selected box
          context.shadowColor = "transparent";
          context.shadowBlur = 0;
        }
        // Style for non-hovered, non-selected boxes
        else {
          context.strokeStyle = "white";
          context.shadowColor = "transparent";
          context.shadowBlur = 0;
        }

        context.lineWidth = 2;
        context.beginPath();
        context.rect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
        context.stroke();

        // Reset shadowBlur for the next box
        context.shadowBlur = 0;
      });
    }
  };

  useEffect(() => {
    drawBoxes();
  }, [boundingBoxes, selectedBoxIndex, hoveredBoxIndex]);

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if a box is clicked
    const clickedBoxIndex = boundingBoxes.findIndex(
      (box) =>
        clickX >= box.x1 - clickTolerance &&
        clickX <= box.x2 + clickTolerance &&
        clickY >= box.y1 - clickTolerance &&
        clickY <= box.y2 + clickTolerance
    );

    if (e.shiftKey) {
      // If Shift key is pressed and a box is clicked, select the box
      if (clickedBoxIndex !== -1) {
        setSelectedBoxIndex(clickedBoxIndex);
        isBoxSelection = true;
      } else {
        setIsDrawing(false);
        setSelectedBoxIndex(null);
      }
    } else {
      // If Shift key is not pressed, start drawing a new box or deselect existing box
      setStartPoint({ x: clickX, y: clickY });
      setIsDrawing(true);
      setSelectedBoxIndex(null);
      isBoxSelection = false;
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseUpX = e.clientX - rect.left;
    const mouseUpY = e.clientY - rect.top;

    // If currently drawing a new box, finalize it
    if (isDrawing) {
      // Create the new box
      const newBox: BoundingBox = {
        x1: Math.min(startPoint.x, mouseUpX),
        y1: Math.min(startPoint.y, mouseUpY),
        x2: Math.max(startPoint.x, mouseUpX),
        y2: Math.max(startPoint.y, mouseUpY),
      };

      // Update the boundingBoxes state with the new box
      onBoundingBoxesChange([...boundingBoxes, newBox]);

      // Clear the temporary rectangle and exit the drawing mode
      setLastTempRect(null);
      setIsDrawing(false);

      return; // Exit the function early to prevent selecting another box
    }

    // If not drawing, proceed with selecting or deselecting a box
    const clickedBoxIndex = boundingBoxes.findIndex(
      (box) =>
        mouseUpX >= box.x1 - clickTolerance &&
        mouseUpX <= box.x2 + clickTolerance &&
        mouseUpY >= box.y1 - clickTolerance &&
        mouseUpY <= box.y2 + clickTolerance
    );

    if (clickedBoxIndex !== -1) {
      // If click is near an existing box, select this box
      setSelectedBoxIndex(clickedBoxIndex);
    } else {
      // If click is not near any box, deselect any selected box
      setSelectedBoxIndex(null);
    }

    // Clear the temporary rectangle
    setLastTempRect(null);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      selectedBoxIndex !== null &&
      (event.key === "Delete" || event.key === "Backspace")
    ) {
      const deletedBox = boundingBoxes[selectedBoxIndex];
      const newBoxes = boundingBoxes.filter(
        (_, index) => index !== selectedBoxIndex
      );
      onBoundingBoxesChange(newBoxes);
      setSelectedBoxIndex(null); // Reset selectedBoxIndex after deletion
    } else if (event.key === "Escape") {
      // Logic to exit the bounding box drawing process
      setIsDrawing(false);
      setLastTempRect(null);
      setSelectedBoxIndex(null);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedBoxIndex, handleKeyDown]);

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hoveredIndex = boundingBoxes.findIndex(
      (box) =>
        mouseX >= box.x1 &&
        mouseX <= box.x2 &&
        mouseY >= box.y1 &&
        mouseY <= box.y2
    );

    setHoveredBoxIndex(hoveredIndex !== -1 ? hoveredIndex : null);

    if (isDrawing && boxCanvasRef.current) {
      const rect = boxCanvasRef.current.getBoundingClientRect();
      const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Draw the new temporary rectangle
      const context = boxCanvasRef.current.getContext("2d");
      if (context) {
        // Clear previous temporary rectangle
        context.clearRect(
          0,
          0,
          boxCanvasRef.current.width,
          boxCanvasRef.current.height
        );
        // Redraw permanent boxes
        drawBoxes();
        // Draw new temporary rectangle
        context.strokeStyle = "red";
        context.lineWidth = 2;
        context.beginPath();
        context.rect(
          startPoint.x,
          startPoint.y,
          currentPoint.x - startPoint.x,
          currentPoint.y - startPoint.y
        );
        context.stroke();
      }
    }
  };

  interface Point {
    x: number;
    y: number;
  }

  const redrawCanvasArea = (startPoint: Point, currentPoint: Point) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    // Calculate the area to be cleared and redrawn
    const minX = Math.min(startPoint.x, currentPoint.x);
    const minY = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    // Clear and redraw only the necessary area
    context.clearRect(minX, minY, width, height);
    context.drawImage(
      imageRef.current,
      minX,
      minY,
      width,
      height,
      minX,
      minY,
      width,
      height
    );
    drawBoxes(); // Redraw boxes that intersect with the area
  };

  // return (
  //   <div
  //     style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
  //   >
  //     <canvas
  //       ref={canvasRef}
  //       onMouseDown={handleMouseDown}
  //       onMouseUp={handleMouseUp}
  //       onMouseMove={handleMouseMove}
  //       style={{ marginBottom: "10px" }}
  //     />
  //   </div>
  // );

  return (
    <div
      style={{
        position: "relative",
        width: imageSize.width,
        height: imageSize.height,
      }}
    >
      <canvas
        ref={underCanvasRef}
        style={{ position: "absolute", left: 0, top: 0, zIndex: 0 }}
      />
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ position: "absolute", left: 0, top: 0, zIndex: 1 }}
      />
      <canvas
        ref={boxCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 2,
          visibility: showBoundingBoxes ? "visible" : "hidden",
        }}
      />
      <canvas
        ref={maskCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ position: "absolute", left: 0, top: 0, zIndex: 3 }}
      />
    </div>
  );
};

export default ImageCanvas;
