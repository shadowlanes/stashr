import type { Bookmark, SaveBookmarkPayload, Tag, UpdateBookmarkPayload } from '@/types';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4101';

export class ApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string) {
    this.baseUrl = API_URL;
    this.token = token;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error((error as { error: string }).error ?? 'API request failed');
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  // ─── Bookmarks ─────────────────────────────────────────────────────────────

  async listBookmarks(params?: {
    archived?: boolean;
    tagId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Bookmark[]> {
    const query = new URLSearchParams();
    if (params?.archived !== undefined) query.set('archived', String(params.archived));
    if (params?.tagId) query.set('tagId', params.tagId);
    if (params?.search) query.set('search', params.search);
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.offset !== undefined) query.set('offset', String(params.offset));

    const qs = query.toString();
    return this.request<Bookmark[]>(`/bookmarks${qs ? `?${qs}` : ''}`);
  }

  async getBookmark(id: string): Promise<Bookmark> {
    return this.request<Bookmark>(`/bookmarks/${id}`);
  }

  async saveBookmark(payload: SaveBookmarkPayload): Promise<Bookmark> {
    return this.request<Bookmark>('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateBookmark(id: string, payload: UpdateBookmarkPayload): Promise<Bookmark> {
    return this.request<Bookmark>(`/bookmarks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteBookmark(id: string): Promise<void> {
    return this.request<void>(`/bookmarks/${id}`, { method: 'DELETE' });
  }

  async getBookmarkContent(id: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/bookmarks/${id}/content`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error('Failed to load article content');
    return response.text();
  }

  // ─── Tags ──────────────────────────────────────────────────────────────────

  async listTags(): Promise<Tag[]> {
    return this.request<Tag[]>('/tags');
  }
}
