export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;
export const INITIAL_FONT_SIZE = 48;
export const TEXT_PADDING = 40;
export const LINE_HEIGHT = 60;

export const CANVAS_SETTINGS = {
  font: {
    family: "Arial",
    minSize: 10,
    maxSize: 100,
    step: 1,
  },
  export: {
    filename: "social-media-post.png",
    type: "image/png",
  },
} as const;

export interface TextElement {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  isDragging: boolean;
}

export interface ImagePosition {
  x: number;
  y: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface ImageStyle {
  position: ImagePosition;
  scale: number;
  dimensions: ImageDimensions;
}

export interface HeaderStyle {
  verticalOffset: number;
  height: number;
  isDragging: boolean;
}

export interface CanvasState {
  text: string;
  fontSize: number;
  textElements: TextElement[];
  selectedImage: HTMLImageElement | null;
  imageStyle: ImageStyle;
  isDraggingImage: boolean;
  headerStyle: HeaderStyle;
}

export interface CanvasActions {
  setText: (text: string) => void;
  setFontSize: (size: number) => void;
  setImageScale: (scale: number) => void;
  setImageWidth: (width: number) => void;
  setImageHeight: (height: number) => void;
  setHeaderHeight: (height: number) => void;
  addText: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseUp: () => void;
  resetToDefaults: () => void;
}
