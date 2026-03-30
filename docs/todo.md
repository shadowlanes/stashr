# Roadmap

Planned features, improvements, and known issues for StashR.

## Known Issues

- [ ] **Chrome extension session sync** — After signing in on the web app, the extension may still show "Sign in". Root cause: `syncSessionWithTab` only syncs from the currently active tab. Needs correct Clerk Chrome Extension setup.

## Missing for Production

- [ ] Production deployment guide (e.g., Docker Compose for a VPS, or Fly.io/Railway templates)
- [ ] API rate limiting
- [ ] Pagination UI in the web app (backend supports `offset`/`limit` but the frontend doesn't paginate)
- [ ] Bulk operations (archive/delete multiple articles at once)
- [ ] Pocket import (parse Pocket's HTML export file)

## Feature Ideas

- [ ] Firefox extension (WXT already supports Firefox — needs build + testing)
- [ ] Full-text search on article body (currently searches titles only)
- [ ] Offline reading / PWA support
- [ ] Dark mode
- [ ] Tag management page (rename, merge, delete tags)
- [ ] Reading progress and highlights
- [ ] Public sharing (shareable read-only link for an article)
- [ ] Mobile app
