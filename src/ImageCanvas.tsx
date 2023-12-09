import React, { useRef, useEffect, useState, MouseEvent } from "react";
import { TransformWrapper, TransformComponent  } from "react-zoom-pan-pinch";
import { Transform } from "stream";
import { transform } from "typescript";


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

  const [transformState, setTransformState] = useState({

    scale: 1,
    positionX: 0,
    positionY: 0,
  });

  // Hook for drawing image
  // This is a astupid solution that works very well. To avoid he flashing
  // when things re render, I just draw the image twice. This shouldn't be 
  // necessary, but I don't notice a latency issue, so I'll leave as is. 
  // If someone wants to refactor this, basically think about having 3
  // canvas instead of 4. Image, box, mask.
  useEffect(() => {
    drawImage();
  }, [imageSrc]);

  // Hook for drawing the segmentation mask
  useEffect(() => {
   drawMasks(); 
  }, [segmentationMaskSrc]);

  useEffect(() => {
    drawBoxes();
  }, [boundingBoxes, selectedBoxIndex, hoveredBoxIndex]);

  const drawImage = () => {
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
        // I don't like that we have to do this but it works
        drawBoxes();
        setImageSize({ width: image.width, height: image.height });
      }
    };
    image.src = imageSrc;
  };

  const drawMasks = () => {
    const image = maskImageRef.current;
    const canvas = maskCanvasRef.current;
    const context = canvas?.getContext("2d");

    image.onload = () => {
      if (canvas && context && image.complete) {
        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      }
    };
    if (segmentationMaskSrc) {
      image.src = segmentationMaskSrc;
    } else {
      if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const drawBoxes = () => {
    const canvas = boxCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);


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

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = (e.clientX - rect.left) // - position.x) / scale;
    const clickY = (e.clientY - rect.top )//- position.y) / scale;

    // back to original coordinates



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


    // const mouseUpX = (e.clientX - rect.left - transformState.positionX) / transformState.scale;
    // const mouseUpY = (e.clientY - rect.top - transformState.positionY) / transformState.scale;

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

    //const mouseX = (e.clientX - rect.left - transformState.positionX) / transformState.scale;
    //const mouseY = (e.clientY - rect.top - transformState.positionY) / transformState.scale;

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


  return (
    <TransformWrapper 
    onTransformed={(ref, transform) => {
      setTransformState({
        scale: transform.scale,
        positionX: transform.positionX,
        positionY: transform.positionY,
      });
    }
  }
    panning={{
    velocityDisabled: true,
    disabled: true,
  }}
  pinch={{
    disabled: false, // Enable pinch actions
  }}
  >
      <TransformComponent>
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

        </TransformComponent>
    </TransformWrapper>
  );
};

export default ImageCanvas;
