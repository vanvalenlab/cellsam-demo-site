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
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      const image = new Image();

      image.onload = () => {
        if (context) {
          canvas.width = image.width;
          canvas.height = image.height;
          context.drawImage(image, 0, 0);
        }
      };

      image.src = imageSrc;
    }
  }, [imageSrc]);

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

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing) return;
    // Drawing logic goes here
    // ...
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    />
  );
};

export default ImageCanvas;
