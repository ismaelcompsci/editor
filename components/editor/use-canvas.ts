"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  CanvasActions as CCanvasActions,
  ImagePosition,
  CanvasState,
  INITIAL_FONT_SIZE,
  CANVAS_SETTINGS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CanvasActions,
  LINE_HEIGHT,
  TEXT_PADDING,
} from "./canvas";

export const DEFAULT_HEADER_STYLE = {};

const DEFAULT_CANVAS_STATE: CanvasState = {
  text: "",
  fontSize: INITIAL_FONT_SIZE,
  textElements: [],
  selectedImage: null,
  imageStyle: {
    position: { x: 0, y: 0 },
    scale: 1,
    dimensions: {
      width: 0,
      height: 0,
      aspectRatio: 1,
    },
  },
  isDraggingImage: false,
  headerStyle: {
    verticalOffset: 100,
    height: 300,
    isDragging: false,
  },
};
export function useCanvas(): [
  React.RefObject<HTMLCanvasElement>,
  CanvasState,
  CCanvasActions
] {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; offsetY: number } | null>(
    null
  );
  const initialPositionRef = useRef<ImagePosition | null>(null);

  const [state, setState] = useState<CanvasState>(DEFAULT_CANVAS_STATE);

  const calculateLayout = useCallback(
    (ctx: CanvasRenderingContext2D, text: string) => {
      ctx.font = `bold ${state.fontSize}px ${CANVAS_SETTINGS.font.family}`;
      const textLines = wrapText(ctx, text, CANVAS_WIDTH - TEXT_PADDING * 2);
      const headerHeight = state.headerStyle.height;
      const imageHeight =
        CANVAS_HEIGHT - headerHeight - state.headerStyle.verticalOffset;

      return {
        textLines,
        headerHeight,
        imageHeight,
        headerY: state.headerStyle.verticalOffset,
        imageY: state.headerStyle.verticalOffset + headerHeight,
      };
    },
    [state.fontSize, state.headerStyle]
  );

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    // Clear and set background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Calculate layout
    const currentText = state.textElements[0]?.text || "";
    const layout = calculateLayout(ctx, currentText);

    // Draw header background
    if (currentText) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, layout.headerY, CANVAS_WIDTH, layout.headerHeight);

      // Draw text
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textY = layout.headerY + layout.headerHeight / 2;
      layout.textLines.forEach((line, index) => {
        const y =
          textY -
          ((layout.textLines.length - 1) * LINE_HEIGHT) / 2 +
          index * LINE_HEIGHT;
        ctx.fillText(line, CANVAS_WIDTH / 2, y);
      });
    }

    // Draw image if exists
    if (state.selectedImage) {
      const { width, height } = state.imageStyle.dimensions;
      const scaledWidth = width * state.imageStyle.scale;
      const scaledHeight = height * state.imageStyle.scale;
      const x = (CANVAS_WIDTH - scaledWidth) / 2 + state.imageStyle.position.x;
      const y = layout.imageY + state.imageStyle.position.y;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, layout.imageY, CANVAS_WIDTH, layout.imageHeight);
      ctx.clip();
      ctx.drawImage(state.selectedImage, x, y, scaledWidth, scaledHeight);
      ctx.restore();
    }
  }, [state, calculateLayout]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const setText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, text }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    setState((prev) => ({ ...prev, fontSize }));
  }, []);

  const setHeaderHeight = useCallback((height: number) => {
    setState((prev) => ({
      ...prev,
      headerStyle: { ...prev.headerStyle, height },
    }));
  }, []);

  const setImageScale = useCallback((scale: number) => {
    setState((prev) => ({
      ...prev,
      imageStyle: { ...prev.imageStyle, scale },
    }));
  }, []);

  const setImageWidth = useCallback((width: number) => {
    setState((prev) => {
      if (isNaN(width) || width < 200 || width > CANVAS_WIDTH) return prev;

      const aspectRatio = prev.imageStyle.dimensions.aspectRatio;
      return {
        ...prev,
        imageStyle: {
          ...prev.imageStyle,
          dimensions: {
            ...prev.imageStyle.dimensions,
            width,
            height: width / aspectRatio,
          },
        },
      };
    });
  }, []);

  const setImageHeight = useCallback((height: number) => {
    setState((prev) => {
      if (
        isNaN(height) ||
        height < 200 ||
        height > CANVAS_HEIGHT - prev.headerStyle.height
      )
        return prev;

      const aspectRatio = prev.imageStyle.dimensions.aspectRatio;
      return {
        ...prev,
        imageStyle: {
          ...prev.imageStyle,
          dimensions: {
            ...prev.imageStyle.dimensions,
            height,
            width: height * aspectRatio,
          },
        },
      };
    });
  }, []);

  const addText = useCallback(() => {
    setState((prev) => {
      if (!prev.text.trim()) return prev;

      return {
        ...prev,
        textElements: [
          {
            text: prev.text,
            x: CANVAS_WIDTH / 2,
            y: 0,
            fontSize: prev.fontSize,
            isDragging: false,
          },
        ],
        text: "",
      };
    });
  }, []);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const initialWidth = Math.min(CANVAS_WIDTH, img.width);
          const initialHeight = initialWidth / aspectRatio;

          setState((prev) => ({
            ...prev,
            selectedImage: img,
            imageStyle: {
              position: { x: 0, y: 0 },
              scale: 1,
              dimensions: {
                width: initialWidth,
                height: initialHeight,
                aspectRatio,
              },
            },
          }));
        };
        img.src = URL.createObjectURL(file);
      }
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const scale = rect.width / CANVAS_WIDTH;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      // Check if clicking in header area
      if (
        y >= state.headerStyle.verticalOffset &&
        y <= state.headerStyle.verticalOffset + state.headerStyle.height
      ) {
        dragStartRef.current = {
          x,
          y,
          offsetY: y - state.headerStyle.verticalOffset,
        };
        setState((prev) => ({
          ...prev,
          headerStyle: { ...prev.headerStyle, isDragging: true },
        }));
        return;
      }

      // Check if clicking in image area
      const imageY =
        state.headerStyle.verticalOffset + state.headerStyle.height;
      if (y >= imageY && state.selectedImage) {
        dragStartRef.current = { x, y, offsetY: 0 };
        initialPositionRef.current = { ...state.imageStyle.position };
        setState((prev) => ({
          ...prev,
          isDraggingImage: true,
        }));
      }
    },
    [
      state.headerStyle.verticalOffset,
      state.headerStyle.height,
      state.selectedImage,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !dragStartRef.current) return;

      const scale = rect.width / CANVAS_WIDTH;
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      setState((prev) => {
        // Handle header dragging
        if (prev.headerStyle.isDragging) {
          const newOffset = Math.max(
            0,
            Math.min(
              y - dragStartRef.current!.offsetY,
              CANVAS_HEIGHT - prev.headerStyle.height
            )
          );
          return {
            ...prev,
            headerStyle: {
              ...prev.headerStyle,
              verticalOffset: newOffset,
            },
          };
        }

        // Handle image dragging
        if (
          prev.isDraggingImage &&
          initialPositionRef.current &&
          prev.selectedImage
        ) {
          const deltaX = x - (dragStartRef?.current?.x ?? 0);
          const deltaY = y - (dragStartRef?.current?.y ?? 0);

          const layout = calculateLayout(
            canvasRef.current!.getContext("2d")!,
            prev.textElements[0]?.text || ""
          );
          const { width, height } = prev.imageStyle.dimensions;
          const scaledWidth = width * prev.imageStyle.scale;
          const scaledHeight = height * prev.imageStyle.scale;

          const maxX = (CANVAS_WIDTH - scaledWidth) / 2;
          const maxY = layout.imageHeight - scaledHeight;

          const newX = Math.max(
            -maxX,
            Math.min(initialPositionRef.current.x + deltaX, maxX)
          );
          const newY = Math.max(
            0,
            Math.min(initialPositionRef.current.y + deltaY, maxY)
          );

          return {
            ...prev,
            imageStyle: {
              ...prev.imageStyle,
              position: { x: newX, y: newY },
            },
          };
        }

        return prev;
      });
    },
    [calculateLayout]
  );

  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null;
    initialPositionRef.current = null;
    setState((prev) => ({
      ...prev,
      isDraggingImage: false,
      headerStyle: { ...prev.headerStyle, isDragging: false },
    }));
  }, []);

  const resetToDefaults = () => {
    setState(DEFAULT_CANVAS_STATE);
  };

  const actions: CanvasActions = {
    setText,
    setFontSize,
    setHeaderHeight,
    setImageScale,
    setImageWidth,
    setImageHeight,
    addText,
    handleImageUpload,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetToDefaults,
  };

  return [canvasRef, state, actions];
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
