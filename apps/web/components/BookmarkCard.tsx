'use client';

import Link from 'next/link';
import type { Bookmark } from '@/types';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onArchive: (id: string, archive: boolean) => void;
  onDelete: (id: string) => void;
}

export function BookmarkCard({ bookmark, onArchive, onDelete }: BookmarkCardProps) {
  const readTime = bookmark.readTimeMinutes ? `${bookmark.readTimeMinutes} min read` : null;
  const domain = bookmark.domain ?? new URL(bookmark.url).hostname;

  return (
    <article className="group relative bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors">
      <div className="flex gap-4">
        {bookmark.thumbnail && (
          <img
            src={bookmark.thumbnail}
            alt=""
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-neutral-800"
          />
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/article/${bookmark.id}`} className="block group/link">
            <h2 className="font-medium text-white group-hover/link:text-blue-400 transition-colors line-clamp-2 leading-snug">
              {bookmark.title ?? bookmark.url}
            </h2>
          </Link>

          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
            <span>{domain}</span>
            {readTime && (
              <>
                <span>·</span>
                <span>{readTime}</span>
              </>
            )}
            {bookmark.isRead && (
              <>
                <span>·</span>
                <span className="text-green-600">Read</span>
              </>
            )}
          </div>

          {bookmark.description && (
            <p className="mt-1.5 text-sm text-neutral-400 line-clamp-2">{bookmark.description}</p>
          )}

          {bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {bookmark.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-xs rounded-full"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions — visible on hover */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onArchive(bookmark.id, !bookmark.isArchived)}
          className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors text-xs"
          title={bookmark.isArchived ? 'Unarchive' : 'Archive'}
        >
          {bookmark.isArchived ? '↩' : '📦'}
        </button>
        <button
          onClick={() => onDelete(bookmark.id)}
          className="p-1.5 rounded-md bg-neutral-800 hover:bg-red-900 text-neutral-400 hover:text-red-400 transition-colors text-xs"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </article>
  );
}
