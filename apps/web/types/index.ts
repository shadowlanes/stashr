export interface Tag {
  id: string;
  name: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  url: string;
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  domain: string | null;
  wordCount: number | null;
  readTimeMinutes: number | null;
  r2Key: string | null;
  isArchived: boolean;
  isRead: boolean;
  savedAt: string;
  createdAt: string;
  tags: Tag[];
}

export interface SaveBookmarkPayload {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  domain?: string;
  wordCount?: number;
  readTimeMinutes?: number;
  content?: string;
  tagNames?: string[];
}

export interface UpdateBookmarkPayload {
  isArchived?: boolean;
  isRead?: boolean;
  tagNames?: string[];
}
