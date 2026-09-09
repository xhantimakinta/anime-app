# AnimeVerse

AnimeVerse is a responsive anime discovery app built with React and Vite. It searches popular anime, presents a featured pick, and gives users a small personal library for favorites and watchlist items.

## Live app

https://xhantimakinta.github.io/anime-app/

## Features

- Search anime titles with a debounced request.
- Browse popular anime when the search is empty.
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
├── public/                 # Static assets, if added later
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

- Search: `GET https://api.jikan.moe/v4/anime?q={query}&limit=12&sfw`
- Popular titles: `GET https://api.jikan.moe/v4/top/anime?limit=12&sfw`

If Jikan returns an error, the same search is sent to AniList's GraphQL endpoint. AniList data is converted to the Jikan-shaped object used by the UI. This keeps the rendering layer independent from the provider that answered.

Both services are public APIs. They can rate-limit or become temporarily unavailable, so the app displays loading and error states instead of failing silently.

## Personal library

Favorites and watchlist IDs are stored locally in the browser under:

- `animeverse-favorites`
- `animeverse-watchlist`

No account or personal data is sent to the app's server because the app has no custom backend.

## Deployment

The repository is hosted at:

https://github.com/xhantimakinta/anime-app

The deployment flow builds the app and publishes `dist` to the `gh-pages` branch:

```bash
npm run deploy
```

GitHub Pages is configured to deploy from the `gh-pages` branch at the repository root. The Vite config uses a relative base path so assets work on the project-page URL.

## Credits and limitations

Anime metadata and images are provided by Jikan and AniList. AnimeVerse is a frontend learning project and is not affiliated with MyAnimeList, AniList, or the anime publishers represented in the data.

Because the app uses third-party public APIs, result availability, rate limits, scores, and image URLs can change independently of this repository.
