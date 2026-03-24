import { Header } from '@/components/Header';
import { BookmarkList } from '@/components/BookmarkList';

export default function ArchivePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6 text-gray-900">Archive</h1>
        <BookmarkList archived={true} />
      </main>
    </div>
  );
}
