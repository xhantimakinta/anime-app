# AnimeVerse

AnimeVerse is a responsive anime discovery app built with React and Vite. It searches 22 anime at a time, presents a featured pick, and gives users a personal library for favorites and watchlist items.

## Live app

https://xhantimakinta.github.io/anime-app/

## Features

- Search anime titles with a 250 ms debounced request.
- Browse 22 popular anime results when the search is empty.
- Jikan REST API as the primary data source.
- AniList GraphQL fallback when Jikan is unavailable.
- Normalized API data so both providers render through the same UI.
- Genre filter chips for Action, Adventure, Comedy, Drama, Fantasy, and Romance.
- Sort results by relevance, score, favorites, or title.
- Save favorites and add shows to a watchlist.
- Persistent personal library stored in browser `localStorage`.
- Anime details modal with synopsis, metadata, and source link.
- Responsive layout for desktop and mobile screens.
- Keyboard-visible focus states and labelled controls.
- GitHub Pages deployment through the `gh-pages` package.
- Loading and error states for slow or unavailable APIs.

## Technology used

| Technology | Purpose |
| --- | --- |
| React 19 | Component-based UI and state management |
| Vite 8 | Development server and production bundler |
| JavaScript (ES modules) | Application logic |
| CSS | Responsive visual design and layout |
| Jikan API v4 | Primary anime data provider |
| AniList GraphQL API | Fallback anime data provider |
| GitHub Pages | Static hosting |
| `gh-pages` | Deployment of the Vite `dist` folder |
| ESLint | Code quality checks |

## Project structure

```text
anime-app/
├── public/                 # Static assets such as the favicon
├── src/
│   ├── App.jsx             # API flow, app state, UI, filters, library, modal
│   ├── App.css             # Component and responsive styles
│   ├── index.css           # Global styles and accessibility focus states
│   └── main.jsx            # React entry point
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## Run locally

Requirements:

- Node.js 18 or newer
- npm 9 or newer

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run lint checks:

```bash
npm run lint
```

## API behavior

The app requests data from Jikan first:

- Search: `GET https://api.jikan.moe/v4/anime?q={query}&limit=22&sfw`
- Popular titles: `GET https://api.jikan.moe/v4/top/anime?limit=22&sfw`

If Jikan returns an error, the same search is sent to AniList's GraphQL endpoint. AniList data is converted to the Jikan-shaped object used by the UI. This keeps the rendering layer independent from the provider that answered.

Both services are public APIs. They can rate-limit or become temporarily unavailable, so the app displays loading and error states instead of failing silently.

### Request flow

```text
Search input -> 250 ms debounce -> Jikan REST API
				      |
				      | failure
				      v
			      AniList GraphQL API
				      |
				      v
			      Normalize and render
```

The `normalizeAniListAnime()` function converts AniList's field names and score scale into the object shape used by the cards and featured panel. This keeps the UI independent from the provider that answered.

## Feature details

- **Search:** changing the search input triggers a delayed request so every keystroke does not immediately call an API.
- **Genre filters:** the filter row checks the normalized genre names for exact matches.
- **Sorting:** relevance preserves provider order; the other modes sort by score, favorites, or title.
- **Favorites:** the heart action stores an anime ID in the favorites list.
- **Watchlist:** the queue action stores an anime ID in the watchlist list.
- **My library:** filters the current API results to saved items.
- **Details modal:** displays the full available synopsis and metadata without leaving the page.
- **Stats:** calculates average score, highest-rated title, and total provider favorites from the active result set.

## Application architecture

The app is intentionally small and frontend-only:

1. `App.jsx` owns API calls, React state, derived filters, library actions, and page markup.
2. Jikan data is used directly because it already matches the display model.
3. AniList data is normalized before it reaches the UI.
4. `useMemo` derives filtered results and summary statistics from state.
5. `localStorage` persists only favorites and watchlist IDs in the visitor's browser.
6. `App.css` owns component styling and responsive breakpoints.
7. `index.css` owns global typography, page background, and keyboard focus styles.

## Personal library

Favorites and watchlist IDs are stored locally in the browser under:

- `animeverse-favorites`
- `animeverse-watchlist`

No account or personal data is sent to the app's server because the app has no custom backend.

The library is browser-local. It disappears if the visitor clears site data, changes browser/device, or uses private browsing. No passwords, tokens, or personal profiles are collected.

## Deployment

The repository is hosted at:

https://github.com/xhantimakinta/anime-app

The deployment flow builds the app and publishes `dist` to the `gh-pages` branch:

```bash
npm run deploy
```

GitHub Pages is configured to deploy from the `gh-pages` branch at the repository root. The Vite config uses a relative base path so assets work on the project-page URL.

For a new clone, the complete deployment flow is:

```bash
git clone https://github.com/xhantimakinta/anime-app.git
cd anime-app
npm install
npm run lint
npm run deploy
```

The repository Pages setting must use `gh-pages` as the source branch and `/ (root)` as the folder.

## Troubleshooting

### The catalog keeps loading

Jikan and AniList are public services and can be rate-limited or temporarily unavailable. Refresh after a short wait. The app automatically tries AniList when Jikan fails.

### The deployed site looks old

GitHub Pages and browser caches can take a short time to refresh. Hard-refresh the page or open it in a private window. Confirm that the `gh-pages` branch has a recent commit and that Pages is configured to deploy from that branch.

### Favorites disappeared

Favorites are stored locally rather than in an account, so they do not follow the visitor to another browser or device.

### Images are missing

Posters are hosted by the external API providers. A provider may change or remove an image URL independently of this repository.

## Credits and limitations

Anime metadata and images are provided by Jikan and AniList. AnimeVerse is a frontend learning project and is not affiliated with MyAnimeList, AniList, or the anime publishers represented in the data.

Because the app uses third-party public APIs, result availability, rate limits, scores, and image URLs can change independently of this repository.

## Future improvements

- Add pagination or infinite scrolling for larger catalogs.
- Add dedicated detail routes and browser history support.
- Add accounts and cloud-synced libraries through a backend.
- Add automated browser tests for search, filtering, favorites, and the modal.
- Add an offline cache for recently viewed results.
