import React, { useRef, useEffect, useState, MouseEvent } from "react";

interface ImageCanvasProps {
  imageSrc: string;
  boundingBoxes: BoundingBox[]; // Added this line
  onBoundingBoxesChange: (boxes: BoundingBox[]) => void;
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
}) => {
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number | null>(null);

  const clickTolerance = 10;
  let isBoxSelection = false; // Flag to indicate if the current action is box selection

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef(new Image());
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const image = imageRef.current;

    image.onload = () => {
      if (canvas && context) {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        drawBoxes(context, boundingBoxes); // Draw the initial boxes
      }
    };

    image.src = imageSrc;
  }, [imageSrc, boundingBoxes]); // Add selectedBoxIndex to the dependency array

  const drawBoxes = (
    context: CanvasRenderingContext2D,
    boxes: BoundingBox[]
  ) => {
    boxes.forEach((box, index) => {
      context.beginPath();
      context.strokeStyle = index === selectedBoxIndex ? "blue" : "red"; // Highlight the selected box in blue
      context.lineWidth = 2;
      context.rect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
      context.stroke();
    });
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
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

      if (clickedBoxIndex !== -1) {
        setSelectedBoxIndex(clickedBoxIndex); // Select the box
        isBoxSelection = true; // Set flag to indicate box selection
      } else {
        setStartPoint({ x: clickX, y: clickY });
        setIsDrawing(true);
        isBoxSelection = false; // Not selecting a box, but drawing a new one
      }
    }
  };
  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    if (isDrawing && !isBoxSelection) {
      setIsDrawing(false);
      const rect = canvasRef.current.getBoundingClientRect();
      const endPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Add new bounding box
      const newBox: BoundingBox = {
        x1: startPoint.x,
        y1: startPoint.y,
        x2: endPoint.x,
        y2: endPoint.y,
      };
      onBoundingBoxesChange([...boundingBoxes, newBox]); // Update parent component directly
    }
    // Reset the flag
    isBoxSelection = false;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      selectedBoxIndex !== null
    ) {
      const newBoxes = boundingBoxes.filter(
        (_, index) => index !== selectedBoxIndex
      );
      onBoundingBoxesChange(newBoxes);
      setSelectedBoxIndex(null);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      // Remove the event listener
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedBoxIndex, boundingBoxes, onBoundingBoxesChange]);

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const context = canvasRef.current.getContext("2d");
    if (context) {
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      context.drawImage(imageRef.current, 0, 0); // Use imageRef.current here
      drawBoxes(context, boundingBoxes); // Redraw existing boxes

      // Draw the current box
      context.beginPath();
      context.strokeStyle = "red";
      context.lineWidth = 2;
      context.rect(
        startPoint.x,
        startPoint.y,
        currentPoint.x - startPoint.x,
        currentPoint.y - startPoint.y
      );
      context.stroke();
    }
  };

  // Function to redraw the canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const image = imageRef.current;

    if (canvas && context && image) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0); // Redraw the image
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ marginBottom: "10px" }}
      />
    </div>
  );
};

export default ImageCanvas;
