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

export interface SavedBookmark {
  id: string;
  url: string;
  title: string | null;
}

export class ExtensionApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string) {
    this.baseUrl = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4101';
    this.token = token;
  }

  async saveBookmark(payload: SaveBookmarkPayload): Promise<{ bookmark: SavedBookmark; alreadyExists: boolean }> {
    const response = await fetch(`${this.baseUrl}/bookmarks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 202) {
      const bookmark = await response.json() as SavedBookmark;
      return { bookmark, alreadyExists: true };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error((err as { error: string }).error ?? 'Failed to save bookmark');
    }

    const bookmark = await response.json() as SavedBookmark;
    return { bookmark, alreadyExists: false };
  }
}
