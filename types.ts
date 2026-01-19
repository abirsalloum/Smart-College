
export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
  size: number;
  uploadedAt: Date;
  folderId?: string; // Optional folder assignment
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: string[];
}
