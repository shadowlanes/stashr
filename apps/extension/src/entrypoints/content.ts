import { Readability } from '@mozilla/readability';

export interface ParsedArticle {
  title: string;
  content: string;
  excerpt: string;
  byline: string | null;
  wordCount: number;
  readTimeMinutes: number;
  thumbnail: string | null;
  description: string | null;
}

function extractMeta(name: string): string | null {
  const el =
    document.querySelector<HTMLMetaElement>(`meta[property="${name}"]`) ??
    document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  return el?.content ?? null;
}

function estimateReadTime(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').trim();
  return text.split(/\s+/).filter(Boolean).length;
}

function parsePage(): ParsedArticle | null {
  const docClone = document.cloneNode(true) as Document;
  const reader = new Readability(docClone);
  const result = reader.parse();

  if (!result) return null;

  const wordCount = countWords(result.content);

  return {
    title: result.title || document.title,
    content: result.content,
    excerpt: result.excerpt,
    byline: result.byline,
    wordCount,
    readTimeMinutes: estimateReadTime(wordCount),
    thumbnail: extractMeta('og:image'),
    description: extractMeta('og:description') ?? result.excerpt,
  };
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Listen for parse requests from the popup
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type === 'PARSE_PAGE') {
        const parsed = parsePage();
        sendResponse({ success: true, data: parsed });
      }
      return true; // Keep the message channel open for async response
    });
  },
});
