export interface ImageItem {
  id: string;
  name: string;
  originalPath: string;
  thumbnail: Blob;
  originalBlob?: Blob;
  width: number;
  height: number;
  size: number;
  tagId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  shortcut?: string;
  order: number;
  createdAt: number;
}

export interface AppState {
  images: ImageItem[];
  tags: Tag[];
  selectedTagId: string | null;
  searchQuery: string;
  currentImageIndex: number;
  isAnnotating: boolean;
}

export const DEFAULT_TAGS: Omit<Tag, 'id' | 'createdAt'>[] = [
  { name: '传统', color: '#3498db', shortcut: '1', order: 0 },
  { name: '时尚', color: '#e74c3c', shortcut: '2', order: 1 },
  { name: '油画', color: '#2ecc71', shortcut: '3', order: 2 },
  { name: '丢弃', color: '#95a5a6', shortcut: '4', order: 3 },
];

export const TAG_COLORS = [
  '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#d35400',
];
