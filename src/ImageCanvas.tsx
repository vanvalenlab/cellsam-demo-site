import React, { useRef, useEffect, useState, MouseEvent } from 'react';

interface ImageCanvasProps {
  imageSrc: string;
  onBoundingBoxesChange: (boxes: BoundingBox[]) => void;
}

export interface BoundingBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageSrc, onBoundingBoxesChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef(new Image());
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
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
  }, [imageSrc, boundingBoxes]);

  const drawBoxes = (context: CanvasRenderingContext2D, boxes: BoundingBox[]) => {
    boxes.forEach(box => {
      context.beginPath();
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.rect(box.startX, box.startY, box.endX - box.startX, box.endY - box.startY);
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
      startX: startPoint.x,
      startY: startPoint.y,
      endX: endPoint.x,
      endY: endPoint.y
    };
    const updatedBoxes = [...boundingBoxes, newBox];
    setBoundingBoxes(updatedBoxes);
    onBoundingBoxesChange(updatedBoxes); // Notify parent component
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



  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{ border: '1px solid black' }} // Optional: added for visibility
    />
  );
};

export default ImageCanvas;