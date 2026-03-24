'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { ApiClient } from '@/lib/api';
import type { Bookmark } from '@/types';

interface ArticleReaderProps {
  id: string;
}

export function ArticleReader({ id }: ArticleReaderProps) {
  const { getToken } = useAuth();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const client = new ApiClient(token);

    const [bookmarkData, html] = await Promise.all([
      client.getBookmark(id),
      client.getBookmarkContent(id).catch(() => null),
    ]);

    setBookmark(bookmarkData);
    if (html) setContent(DOMPurify.sanitize(html));

    // Mark as read
    if (!bookmarkData.isRead) {
      await client.updateBookmark(id, { isRead: true }).catch(() => null);
    }
  }, [getToken, id]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  if (error || !bookmark) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-sm">{error ?? 'Article not found'}</p>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
          ← Back to reading list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← Back
          </Link>
          <span className="text-gray-400 text-sm truncate">{bookmark.domain ?? bookmark.url}</span>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Original ↗
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Article header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900 mb-3">
            {bookmark.title ?? bookmark.url}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            {bookmark.domain && <span>{bookmark.domain}</span>}
            {bookmark.readTimeMinutes && (
              <>
                <span>·</span>
                <span>{bookmark.readTimeMinutes} min read</span>
              </>
            )}
          </div>
        </div>

        {/* Article content or fallback */}
        {content ? (
          <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-400 text-sm">
              Article content wasn&apos;t saved — open the original instead.
            </p>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
            >
              Open original article ↗
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
