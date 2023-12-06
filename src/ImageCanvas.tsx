import React, { useRef, useEffect, useState, MouseEvent } from 'react';

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

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageSrc, boundingBoxes, onBoundingBoxesChange }) => {
const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef(new Image());
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const image = imageRef.current;

    image.onload = () => {
      if (canvas && context) {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        drawBoxes(context, boundingBoxes);
      }
    };

    image.src = imageSrc;
  }, [imageSrc]);

    const drawBoxes = (context: CanvasRenderingContext2D, boxes: BoundingBox[]) => {
    boxes.forEach(box => {
      context.beginPath();
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.rect(box.x1, box.y1, box.x2- box.x1, box.y2- box.y1);
      context.stroke();
    });
  };

  const handleMouseDown = (e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setStartPoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDrawing(true);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    setIsDrawing(false);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const endPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Add new bounding box
    const newBox: BoundingBox = {
      x1: startPoint.x,
      y1: startPoint.y,
      x2: endPoint.x,
      y2: endPoint.y
    };
    onBoundingBoxesChange([...boundingBoxes, newBox]); // Update parent component directly
  };

  
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      context.drawImage(imageRef.current, 0, 0); // Use imageRef.current here
      drawBoxes(context, boundingBoxes); // Redraw existing boxes

      // Draw the current box
      context.beginPath();
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.rect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
      context.stroke();
    }
  };


  // Function to redraw the canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const image = imageRef.current;
    
    if (canvas && context && image) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0); // Redraw the image
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {/* Flex container */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{  marginBottom: '10px' }} // Canvas styling
      />
    </div>
);
};

export default ImageCanvas;