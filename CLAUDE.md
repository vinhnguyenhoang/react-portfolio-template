# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 18 portfolio website builder with live search, category filtering, multi-language support, and theming. Built with Vite + Vitest.

## Stack

- **Runtime:** Node 18, React 18.3, Vite 6
- **Testing:** Vitest 4 + React Testing Library + jsdom
- **Styling:** SCSS (sass-embedded), Bootstrap 5
- **Linting:** ESLint 9

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build → dist/
npm run lint         # ESLint check
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run (CI mode)
npx vitest run src/hooks/__tests__/usePortfolioSearch.test.js  # Run a single test file
```

## Architecture

### Boot sequence

`main.jsx` loads `settings.json` first and applies developer flags, then mounts two wrapper layers:

1. **AppEssentialsWrapper** — `Preloader` → `DataProvider` (fetches all JSON data before rendering children)
2. **AppCapabilitiesWrapper** — nests providers in order: `LanguageProvider` → `ViewportProvider` → `InputProvider` → `FeedbacksProvider` → `ThemeProvider` → `LocationProvider` → `NavigationProvider`

None of the capability providers render children until their own initialization is complete (they all gate on a state flag).

### Data flow

All content lives in `public/data/` as JSON. `DataProvider` fetches them at boot and exposes them via `useData()`:

- `settings.json` — app-wide config (themes, languages, background style, EmailJS keys)
- `profile.json` — personal info (name, bio, avatar, social links)
- `strings.json` — global i18n strings (e.g. "present", "experience_year_count_plural")
- `categories.json` — nav categories; each section must belong to one or the app throws
- `sections.json` — ordered list of sections; each entry has `id`, `categoryId`, `jsonPath`, `faIcon`
- `sections/*.json` — per-section article data; loaded lazily by `DataProvider._loadSectionsData`

After loading, `DataProvider` binds each section to its category (adds `section.category` and `category.sections[]`), then validates that no category is empty. Invalid `categoryId` on a section is a fatal error.

### Section rendering

`Portfolio` → `LayoutSlideshow` renders **all** sections simultaneously but only one is `visible` at a time. `Section` manages its own HIDDEN/WILL_SHOW/SHOWING/SHOWN/WILL_HIDE/HIDING lifecycle with timed transitions via `useScheduler`. Only non-HIDDEN sections are mounted in the DOM.

### Article system

Each section's JSON has a `component` field (e.g. `"ArticlePortfolio"`) and an `items` array. `SectionContent` instantiates the correct `Article*` component. Items are parsed into `ArticleItemDataWrapper` objects; the section data is wrapped in `ArticleDataWrapper`, which handles:

- Ordering (`order_items_by`, `order_items_sort` from `settings`)
- Category filtering (`categorize_by` list in `settings`)
- Localization (delegates to `language.getTranslation`)

### Localization

`LanguageProvider` manages language selection (persisted to localStorage, auto-detected from `navigator.language`). Text in JSON uses per-language keys:
```json
"locales": { "en": { "title": "Hello" }, "es": { "title": "Hola" } }
```
In text fields, `{{highlighted}}` renders as a highlighted `<span>`, `[[bold]]` renders as `<strong>`.

### Portfolio search

`usePortfolioSearch` (300ms debounce) filters `ArticleItemDataWrapper[]` by title, stripped-HTML text, and tags. It sits *after* the category filter — `ArticlePortfolio` passes already-category-filtered items to the hook. The empty state gates on `debouncedQuery` (not `searchQuery`) to avoid a flash on each keystroke.

### Utilities

`useUtils()` (from `src/hooks/utils.js`) is a facade that composes all `_*-utils.js` modules into namespaced groups: `utils.file`, `utils.log`, `utils.css`, `utils.storage`, `utils.date`, etc. It is called outside React components in model classes like `ArticleDataWrapper`.

### Developer settings

`settings.json → developerSettings` controls:
- `debugMode` — skips preloader/animations, forces plain background
- `fakeEmailRequests` — stubs EmailJS calls
- `stayOnThePreloaderScreen` — holds preloader indefinitely

These flags are ignored in production (`constants.PRODUCTION_MODE`).

## Testing

Tests live next to source in `__tests__/` subdirectories. All tests use Vitest globals — no need to import `describe`, `test`, `expect`. Test setup is in `src/test-setup.js`.

## Conventions

- Components: PascalCase in `src/components/`
- Hooks: camelCase with `use` prefix in `src/hooks/`
- Each component has a matching `.scss` file
- Public data in `public/data/` as JSON (not TypeScript types)
- CI runs lint + tests on every push/PR (`.github/workflows/ci.yml`)
- Deploy to GitHub Pages on push to `main` (`.github/workflows/deploy.yml`)
