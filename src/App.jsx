import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = 'https://api.jikan.moe/v4'
const ANILIST_URL = 'https://graphql.anilist.co'

const categoryFilters = ['All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance']
const storageKeys = {
  favorites: 'animeverse-favorites',
  watchlist: 'animeverse-watchlist',
}

const normalizeAniListAnime = (media) =>
  media.map((item) => ({
    mal_id: item.id,
    title: item.title?.english || item.title?.romaji || 'Unknown title',
    synopsis: item.description?.replace(/<[^>]+>/g, ' ') || 'No description available.',
    score: item.averageScore ? item.averageScore / 10 : 0,
    rank: item.rankings?.[0]?.rank || null,
    episodes: item.episodes || 'N/A',
    status: item.status || 'Unknown',
    favorites: item.favourites || 0,
    genres: (item.genres || []).map((genre) => ({ name: genre })),
    images: {
      jpg: {
        large_image_url: item.coverImage?.large || '',
        image_url: item.coverImage?.large || '',
      },
    },
    url: item.siteUrl || '#',
  }))

const fetchJikanAnime = async (query) => {
  const endpoint = query.trim()
    ? `${API_BASE}/anime?q=${encodeURIComponent(query.trim())}&limit=12&sfw`
    : `${API_BASE}/top/anime?limit=12&sfw`

  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error('Jikan failed to respond.')
  }

  const data = await response.json()
  return data.data ?? []
}

const fetchAniListAnime = async (query) => {
  const searchText = query.trim() || 'naruto'

  const requestBody = {
    query: `
      query ($search: String) {
        Page(page: 1, perPage: 12) {
          media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            description
            episodes
            status
            averageScore
            favourites
            genres
            coverImage { large }
            siteUrl
            rankings { rank }
          }
        }
      }
    `,
    variables: { search: searchText },
  }

  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error('AniList failed to respond.')
  }

  const data = await response.json()
  return normalizeAniListAnime(data?.data?.Page?.media ?? [])
}

const getGenreNames = (genres = []) => {
  if (!genres.length) return ['Action']
  return genres.map((genre) => (typeof genre === 'string' ? genre : genre.name)).filter(Boolean)
}

const getImageUrl = (item) =>
  item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || item.images?.webp?.large_image_url || ''

const getStoredIds = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function App() {
  const [query, setQuery] = useState('naruto')
  const [anime, setAnime] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState('relevance')
  const [favorites, setFavorites] = useState(() => getStoredIds(storageKeys.favorites))
  const [watchlist, setWatchlist] = useState(() => getStoredIds(storageKeys.watchlist))
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKeys.favorites, JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem(storageKeys.watchlist, JSON.stringify(watchlist))
  }, [watchlist])

  useEffect(() => {
    const fetchAnime = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await fetchJikanAnime(query)
        setAnime(data)
      } catch {
        try {
          const fallbackData = await fetchAniListAnime(query)
          setAnime(fallbackData)
        } catch (aniListError) {
          setError(
            aniListError.message ||
              'Unable to load anime data from the API right now. Please try again in a moment.'
          )
          setAnime([])
        }
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchAnime, 250)
    return () => clearTimeout(timer)
  }, [query])

  const filteredAnime = useMemo(() => {
    if (!anime.length) return []
    const filtered = anime.filter((item) => {
      const matchesGenre =
        activeFilter === 'All' ||
        getGenreNames(item.genres).some((genre) => genre.toLowerCase() === activeFilter.toLowerCase())
      const id = item.mal_id || item.id
      return matchesGenre && (!showFavoritesOnly || favorites.includes(id))
    })

    return [...filtered].sort((first, second) => {
      if (sortBy === 'score') return (second.score || 0) - (first.score || 0)
      if (sortBy === 'favorites') return (second.favorites || 0) - (first.favorites || 0)
      if (sortBy === 'title') return first.title.localeCompare(second.title)
      return 0
    })
  }, [anime, activeFilter, favorites, showFavoritesOnly, sortBy])

  const featuredAnime = filteredAnime[0] || anime[0]

  const summary = useMemo(() => {
    const list = filteredAnime.length ? filteredAnime : anime
    if (!list.length) {
      return { avgScore: '0.0', topTitle: 'No results', totalFavorites: 0 }
    }

    const total = list.reduce((sum, item) => sum + (item.score || 0), 0)
    const average = total / list.length
    const topRated = list.reduce((best, current) => {
      if (!best) return current
      return (current.score || 0) > (best.score || 0) ? current : best
    }, null)

    const totalFavorites = list.reduce((sum, item) => sum + (item.favorites || 0), 0)

    return {
      avgScore: average.toFixed(1),
      topTitle: topRated?.title || 'N/A',
      totalFavorites,
    }
  }, [anime, filteredAnime])

  const formatGenres = (genres = []) =>
    getGenreNames(genres).slice(0, 3).join(' • ') || 'Action / Adventure'

  const getAnimeId = (item) => item.mal_id || item.id || item.title
  const isFavorite = (item) => favorites.includes(getAnimeId(item))
  const isInWatchlist = (item) => watchlist.includes(getAnimeId(item))

  const toggleFavorite = (item) => {
    const id = getAnimeId(item)
    setFavorites((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]))
  }

  const toggleWatchlist = (item) => {
    const id = getAnimeId(item)
    setWatchlist((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">A</div>
          <div>
            <p className="brand-kicker">Discover</p>
            <h1>AnimeVerse</h1>
          </div>
        </div>
        <nav className="nav-links" aria-label="main navigation">
          <a href="#featured">Featured</a>
          <a href="#catalog">Catalog</a>
          <a href="#trending">Trending</a>
          <button type="button" className="library-button" onClick={() => setShowFavoritesOnly((current) => !current)}>
            {showFavoritesOnly ? 'Show catalog' : `My library (${favorites.length + watchlist.length})`}
          </button>
        </nav>
      </header>

      <main className="page">
        <section className="hero" id="featured">
          {featuredAnime ? (
            <>
              <div className="hero-copy">
                <p className="eyebrow">Top pick</p>
                <h2>{featuredAnime.title}</h2>
                <p className="hero-summary">
                  {featuredAnime.synopsis?.replace(/\s+/g, ' ').slice(0, 180) || 'A fan-favorite anime filled with action, emotion, and unforgettable moments.'}
                </p>

                <div className="meta-row">
                  <span>⭐ {featuredAnime.score || 'N/A'}</span>
                  <span>#{featuredAnime.rank || 'N/A'}</span>
                  <span>{featuredAnime.episodes || 'N/A'} eps</span>
                  <span>{featuredAnime.status || 'Unknown'}</span>
                </div>

                <div className="genre-list">{formatGenres(featuredAnime.genres)}</div>

                <div className="cta-row">
                  <a href={featuredAnime.url} target="_blank" rel="noreferrer">
                    View details
                  </a>
                </div>
              </div>

              <div className="hero-poster">
                <img
                  src={getImageUrl(featuredAnime)}
                  alt={featuredAnime.title}
                />
              </div>
            </>
          ) : (
            <div className="empty-state">No featured anime available.</div>
          )}
        </section>

        <section className="toolbar" aria-label="anime search">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search anime titles..."
            aria-label="Search anime titles"
          />
          <button type="button" onClick={() => setQuery('')}>
            Clear
          </button>
        </section>

        <div className="catalog-controls">
          <div className="filter-row" aria-label="anime filters">
            {categoryFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={activeFilter === filter ? 'filter-button active' : 'filter-button'}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
          <label className="sort-control">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="score">Highest score</option>
              <option value="favorites">Most favorited</option>
              <option value="title">Title A-Z</option>
            </select>
          </label>
        </div>

        <section className="stats" id="trending">
          <div className="stat-box">
            <span className="stat-label">Average score</span>
            <strong>{summary.avgScore}</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Top rated</span>
            <strong>{summary.topTitle}</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Favorites</span>
            <strong>{summary.totalFavorites.toLocaleString()}</strong>
          </div>
        </section>

        {loading ? (
          <div className="status-panel">Loading anime catalog...</div>
        ) : error ? (
          <div className="status-panel error">{error}</div>
        ) : (
          <section className="catalog" id="catalog">
            {filteredAnime.map((item) => (
              <article className="anime-card" key={item.mal_id || item.title}>
                <img
                  src={getImageUrl(item)}
                  alt={item.title}
                />
                <div className="card-body">
                  <div className="card-topline">
                    <span className="badge">⭐ {item.score || 'N/A'}</span>
                    <span className="badge muted">#{item.rank || 'N/A'}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>
                    {item.synopsis?.replace(/\s+/g, ' ').slice(0, 120) || 'An intense anime experience with vibrant storytelling and unforgettable characters.'}
                  </p>
                  <div className="genre-list small">{formatGenres(item.genres)}</div>
                  <div className="card-meta">
                    <span>{item.episodes || 'N/A'} eps</span>
                    <span>{(item.favorites || 0).toLocaleString()} fav</span>
                  </div>
                  <div className="card-actions">
                    <button type="button" onClick={() => toggleFavorite(item)} className={isFavorite(item) ? 'icon-button selected' : 'icon-button'}>
                      {isFavorite(item) ? '♥' : '♡'} <span>{isFavorite(item) ? 'Saved' : 'Favorite'}</span>
                    </button>
                    <button type="button" onClick={() => toggleWatchlist(item)} className={isInWatchlist(item) ? 'icon-button selected' : 'icon-button'}>
                      {isInWatchlist(item) ? '✓' : '+'} <span>{isInWatchlist(item) ? 'Queued' : 'Watchlist'}</span>
                    </button>
                    <button type="button" className="details-button" onClick={() => setSelectedAnime(item)}>
                      Details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {selectedAnime && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedAnime(null)}>
          <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="details-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSelectedAnime(null)} aria-label="Close details">×</button>
            <img src={getImageUrl(selectedAnime)} alt="" />
            <div>
              <p className="eyebrow">Anime details</p>
              <h2 id="details-title">{selectedAnime.title}</h2>
              <p className="modal-summary">{selectedAnime.synopsis || 'No description available.'}</p>
              <div className="meta-row">
                <span>⭐ {selectedAnime.score || 'N/A'}</span>
                <span>{selectedAnime.episodes || 'N/A'} episodes</span>
                <span>{selectedAnime.status || 'Unknown'}</span>
              </div>
              <div className="modal-actions">
                <button type="button" className="primary-action" onClick={() => toggleFavorite(selectedAnime)}>
                  {isFavorite(selectedAnime) ? 'Remove favorite' : 'Add favorite'}
                </button>
                <a href={selectedAnime.url} target="_blank" rel="noreferrer" className="secondary-action">Open source</a>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
