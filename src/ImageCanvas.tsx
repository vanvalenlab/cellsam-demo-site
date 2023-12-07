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

  const clickTolerance = 10;
  let isBoxSelection = false; // Flag to indicate if the current action is box selection

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef(new Image());
  const maskImageRef = useRef(new Image());

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (segmentationMaskSrc) {
      const maskImage = maskImageRef.current;
      maskImage.onload = () => {
        drawMask();
      };
      maskImage.src = segmentationMaskSrc;
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

  useEffect(() => {
    const image = imageRef.current;
    image.onload = () => {
      drawImage();
      drawBoxes();
      if (segmentationMaskSrc) {
        drawMask(); // Draw the mask if it exists
      }
    };
    image.src = imageSrc;
  }, [imageSrc, segmentationMaskSrc]); // Add segmentationMaskSrc as a dependency

  const drawImage = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const image = imageRef.current;

    if (canvas && context && image.complete) {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
    }
  };

  const drawBoxes = () => {
    if (!showBoundingBoxes) return; // Don't draw boxes if showBoundingBoxes is false
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawImage(); // Redraw the image to clear previous box drawings

      boundingBoxes.forEach((box, index) => {
        context.strokeStyle = index === selectedBoxIndex ? "red" : "white";
        context.lineWidth = 2;
        context.beginPath();
        context.rect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
        context.stroke();
      });
    }
  };

  useEffect(() => {
    drawBoxes();
  }, [boundingBoxes, selectedBoxIndex]);

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

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseUpX = e.clientX - rect.left;
    const mouseUpY = e.clientY - rect.top;

    // Check if the mouse up event is near an existing bounding box
    const clickedBoxIndex = boundingBoxes.findIndex(
      (box) =>
        mouseUpX >= box.x1 - clickTolerance &&
        mouseUpX <= box.x2 + clickTolerance &&
        mouseUpY >= box.y1 - clickTolerance &&
        mouseUpY <= box.y2 + clickTolerance
    );

    if (clickedBoxIndex !== -1) {
      // Click is near an existing box, select this box
      setSelectedBoxIndex(clickedBoxIndex);
    } else if (isDrawing) {
      // Click is not near an existing box and is drawing, create a new box
      setIsDrawing(false);

      const newBox: BoundingBox = {
        x1: Math.min(startPoint.x, mouseUpX),
        y1: Math.min(startPoint.y, mouseUpY),
        x2: Math.max(startPoint.x, mouseUpX),
        y2: Math.max(startPoint.y, mouseUpY),
      };

      onBoundingBoxesChange([...boundingBoxes, newBox]);
      setSelectedBoxIndex(boundingBoxes.length); // Select the newly created box
    } else {
      // Click is not near any box and not drawing, deselect any selected box
      setSelectedBoxIndex(null);
    }

    setLastTempRect(null); // Clear the last temporary rectangle
  };

  const redrawDeletedBoxArea = (deletedBox: BoundingBox) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const { x1, y1, x2, y2 } = deletedBox;
    const width = x2 - x1;
    const height = y2 - y1;

    context.clearRect(x1, y1, width, height);
    context.drawImage(
      imageRef.current,
      x1,
      y1,
      width,
      height,
      x1,
      y1,
      width,
      height
    );
    drawBoxes(); // Redraw remaining boxes
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      selectedBoxIndex !== null
    ) {
      const deletedBox = boundingBoxes[selectedBoxIndex];
      const newBoxes = boundingBoxes.filter(
        (_, index) => index !== selectedBoxIndex
      );
      onBoundingBoxesChange(newBoxes);
      setSelectedBoxIndex(null); // Reset selectedBoxIndex after deletion
      redrawDeletedBoxArea(deletedBox); // Redraw only the deleted box area
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      // Remove the event listener
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedBoxIndex, boundingBoxes, onBoundingBoxesChange]);
  const [lastTempRect, setLastTempRect] = useState<BoundingBox | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const currentPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Clear the last temporary rectangle
      if (lastTempRect) {
        redrawCanvasArea(
          { x: lastTempRect.x1, y: lastTempRect.y1 },
          { x: lastTempRect.x2, y: lastTempRect.y2 }
        );
      }

      // Set the new temporary rectangle
      setLastTempRect({
        x1: startPoint.x,
        y1: startPoint.y,
        x2: currentPoint.x,
        y2: currentPoint.y,
      });

      // Draw the new temporary rectangle
      const context = canvasRef.current.getContext("2d");
      if (context) {
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

  // Function to redraw the canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(imageRef.current, 0, 0);
      drawBoxes();
    }
  };
  useEffect(() => {
    redrawCanvas();
  }, [boundingBoxes, selectedBoxIndex]);

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
