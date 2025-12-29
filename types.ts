
export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  previewUrl: string;
}

export interface GalleryItem {
  id: string;
  originalImage: string;
  processedImage: string;
  styleId: string;
  timestamp: number;
}

export interface AppState {
  view: 'home' | 'camera' | 'editing' | 'result' | 'gallery' | 'gallery-detail';
  image: string | null;
  selectedStyle: ArtStyle | null;
  processedImage: string | null;
  isProcessing: boolean;
  error: string | null;
  gallery: GalleryItem[];
  selectedGalleryItem: GalleryItem | null;
}

export type View = 'home' | 'camera' | 'editing' | 'result' | 'gallery' | 'gallery-detail';
