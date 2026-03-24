'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ApiClient } from '@/lib/api';
import { BookmarkCard } from './BookmarkCard';
import type { Bookmark } from '@/types';

interface BookmarkListProps {
  archived?: boolean;
}

export function BookmarkList({ archived = false }: BookmarkListProps) {
  const { getToken } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const client = new ApiClient(token);
    const data = await client.listBookmarks({ archived, search: search || undefined });
    setBookmarks(data);
  }, [getToken, archived, search]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchBookmarks()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [fetchBookmarks]);

  const handleArchive = async (id: string, archive: boolean) => {
    const token = await getToken();
    if (!token) return;
    const client = new ApiClient(token);
    await client.updateBookmark(id, { isArchived: archive });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    const client = new ApiClient(token);
    await client.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search bookmarks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
      />

      {loading && (
        <div className="text-center py-12 text-neutral-500 text-sm">Loading...</div>
      )}

      {error && (
        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && bookmarks.length === 0 && (
        <div className="text-center py-12 text-neutral-500 text-sm">
          {archived ? 'Nothing archived yet.' : 'No bookmarks yet — save something from the extension!'}
        </div>
      )}

      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
