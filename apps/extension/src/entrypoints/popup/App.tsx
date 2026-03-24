import { useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/chrome-extension';
import { ExtensionApiClient } from '../../utils/api';
import type { ParsedArticle } from '../content';

type State =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'parsing' }
  | { status: 'preview'; article: ParsedArticle; url: string; tabId: number }
  | { status: 'saving' }
  | { status: 'saved'; alreadyExists: boolean }
  | { status: 'error'; message: string };

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error('No active tab');
  return tab;
}

async function parseActiveTab(tabId: number): Promise<ParsedArticle | null> {
  // Inject the content script if it isn't already running
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['/content-scripts/content.js'],
  }).catch(() => null); // May already be injected — ignore error

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'PARSE_PAGE' }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        resolve(null);
      } else {
        resolve(response.data as ParsedArticle | null);
      }
    });
  });
}

function LoadingView() {
  return (
    <div style={{ padding: 20, textAlign: 'center', color: '#737373', fontSize: 13 }}>
      Loading...
    </div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{message}</p>
      <button className="btn-secondary" onClick={onRetry}>Try again</button>
    </div>
  );
}

function SavedView({ alreadyExists, onOpenApp }: { alreadyExists: boolean; onOpenApp: () => void }) {
  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{alreadyExists ? '📌' : '✓'}</div>
      <p style={{ color: alreadyExists ? '#facc15' : '#4ade80', fontWeight: 500, marginBottom: 12 }}>
        {alreadyExists ? 'Already in your Stashr!' : 'Saved to Stashr!'}
      </p>
      <button className="btn-secondary" onClick={onOpenApp} style={{ fontSize: 12 }}>
        Open reading list ↗
      </button>
    </div>
  );
}

function PreviewView({
  article,
  url,
  onSave,
  onCancel,
  saving,
}: {
  article: ParsedArticle;
  url: string;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' }}>
          Stashr
        </span>
      </div>

      {/* Article preview */}
      <div
        style={{
          background: '#171717',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          border: '1px solid #262626',
        }}
      >
        <p
          style={{
            fontWeight: 500,
            color: '#fff',
            lineHeight: 1.4,
            marginBottom: 6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.title}
        </p>
        <p style={{ color: '#737373', fontSize: 12 }}>
          {new URL(url).hostname} · {article.readTimeMinutes} min read · {article.wordCount.toLocaleString()} words
        </p>
        {article.description && (
          <p
            style={{
              color: '#a3a3a3',
              fontSize: 12,
              marginTop: 6,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-secondary" onClick={onCancel} disabled={saving} style={{ flex: 1 }}>
          Cancel
        </button>
        <button className="btn-primary" onClick={onSave} disabled={saving} style={{ flex: 2 }}>
          {saving ? 'Saving...' : 'Save to Stashr'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setState({ status: 'unauthenticated' });
      return;
    }

    // Only auto-parse on initial load, not on subsequent auth state changes
    setState((prev) => {
      if (prev.status !== 'loading') return prev;
      return { status: 'parsing' };
    });
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (state.status !== 'parsing') return;

    getActiveTab()
      .then(async (tab) => {
        const article = await parseActiveTab(tab.id!);
        if (!article) {
          setState({
            status: 'error',
            message: 'Could not parse this page. Try the original URL instead.',
          });
          return;
        }
        setState({ status: 'preview', article, url: tab.url!, tabId: tab.id! });
      })
      .catch((err: unknown) =>
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' }),
      );
  }, [state.status]);

  const handleSave = async () => {
    if (state.status !== 'preview') return;
    const { article, url } = state;

    setState({ status: 'saving' });
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const client = new ExtensionApiClient(token);
      const { alreadyExists } = await client.saveBookmark({
        url,
        title: article.title,
        description: article.description ?? undefined,
        thumbnail: article.thumbnail ?? undefined,
        domain: new URL(url).hostname,
        wordCount: article.wordCount,
        readTimeMinutes: article.readTimeMinutes,
        content: article.content,
      });

      setState({ status: 'saved', alreadyExists });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Save failed' });
    }
  };

  const handleOpenApp = () => {
    const webAppUrl = import.meta.env['VITE_WEB_APP_URL'] ?? 'http://localhost:4103';
    chrome.tabs.create({ url: webAppUrl });
    window.close();
  };

  const handleRetry = () => setState({ status: 'loading' });

  if (!isLoaded || state.status === 'loading' || state.status === 'parsing') {
    return <LoadingView />;
  }

  if (state.status === 'unauthenticated') {
    const webAppUrl = import.meta.env['VITE_WEB_APP_URL'] ?? 'http://localhost:4103';
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Stashr</p>
        <p style={{ color: '#737373', fontSize: 13, marginBottom: 16 }}>
          Sign in to start saving articles.
        </p>
        <button
          className="btn-primary"
          onClick={() => {
            chrome.tabs.create({ url: `${webAppUrl}/sign-in` });
            window.close();
          }}
        >
          Sign in via Stashr →
        </button>
        <p style={{ color: '#525252', fontSize: 11, marginTop: 10 }}>
          After signing in, click the extension again.
        </p>
      </div>
    );
  }

  if (state.status === 'error') {
    return <ErrorView message={state.message} onRetry={handleRetry} />;
  }

  if (state.status === 'saved') {
    return <SavedView alreadyExists={state.alreadyExists} onOpenApp={handleOpenApp} />;
  }

  if (state.status === 'preview' || state.status === 'saving') {
    const preview = state.status === 'preview' ? state : null;
    return (
      <PreviewView
        article={preview ? preview.article : (state as never)}
        url={preview ? preview.url : ''}
        onSave={handleSave}
        onCancel={window.close}
        saving={state.status === 'saving'}
      />
    );
  }

  return null;
}
