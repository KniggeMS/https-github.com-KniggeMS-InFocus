import { SearchResult, MediaType, MediaItem, StreamingProvider, CastMember } from '../types';

const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
export const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/original';

/**
 * AUTOMATISCHE KEY-ERKENNUNG:
 * Versucht den Key aus Vite-Umgebungsvariablen zu lesen. 
 * Falls nicht vorhanden, wird auf den localStorage (manuelle Eingabe) zurückgegriffen.
 */
export const getEffectiveApiKey = (providedKey?: string): string => {
  const envKey = import.meta.env.VITE_TMDB_API_KEY; 
  return providedKey || envKey || localStorage.getItem('tmdb_api_key') || '';
};

const GENRES: Record<number, string> = {
  28: "Action", 12: "Abenteuer", 16: "Animation", 35: "Komödie", 80: "Krimi",
  99: "Dokumentarfilm", 18: "Drama", 10751: "Familie", 14: "Fantasy", 36: "Historie",
  27: "Horror", 10402: "Musik", 9648: "Mystery", 10749: "Liebesfilm", 878: "Science Fiction",
  10770: "TV-Film", 53: "Thriller", 10752: "Kriegsfilm", 37: "Western",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics"
};

const mapGenres = (ids: number[] = []): string[] => {
  return ids.map(id => GENRES[id]).filter(Boolean).slice(0, 3);
};

export const searchTMDB = async (query: string, apiKey: string, year?: string): Promise<SearchResult[]> => {
  const effectiveKey = getEffectiveApiKey(apiKey);
  if (!effectiveKey) return [];

  try {
    let url = `${BASE_URL}/search/multi?api_key=${effectiveKey}&language=de-DE&query=${encodeURIComponent(query)}&include_adult=false`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('TMDB Search failed');
    const data = await response.json();

    let results = data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        tmdbId: item.id,
        title: item.title || item.name,
        originalTitle: item.original_title || item.original_name,
        year: new Date(item.release_date || item.first_air_date || Date.now()).getFullYear() || 0,
        type: item.media_type === 'tv' ? MediaType.SERIES : MediaType.MOVIE,
        genre: mapGenres(item.genre_ids),
        plot: item.overview || "Keine Beschreibung verfügbar.",
        rating: item.vote_average || 0,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path
      }));

      if (year) {
          const yearNum = parseInt(year);
          const exactMatches = results.filter((r: any) => Math.abs(r.year - yearNum) <= 1);
          if (exactMatches.length > 0) return exactMatches;
      }
      return results;
  } catch (error) {
    console.error("TMDB API Error:", error);
    return [];
  }
};

export const findByExternalId = async (externalId: string, apiKey: string): Promise<SearchResult | null> => {
    const effectiveKey = getEffectiveApiKey(apiKey);
    if (!effectiveKey) return null;
    try {
        const response = await fetch(`${BASE_URL}/find/${externalId}?api_key=${effectiveKey}&external_source=imdb_id&language=de-DE`);
        const data = await response.json();
        let item = data.movie_results?.[0] || data.tv_results?.[0];
        if (!item) return null;
        const isTv = !!data.tv_results?.[0];

        return {
            tmdbId: item.id,
            imdbId: externalId,
            title: item.title || item.name,
            originalTitle: item.original_title || item.original_name,
            year: new Date(item.release_date || item.first_air_date || Date.now()).getFullYear() || 0,
            type: isTv ? MediaType.SERIES : MediaType.MOVIE,
            genre: mapGenres(item.genre_ids),
            plot: item.overview || "Keine Beschreibung verfügbar.",
            rating: item.vote_average || 0,
            posterPath: item.poster_path,
            backdropPath: item.backdrop_path
        };
    } catch (e) {
        console.error("TMDB Find Error", e);
        return null;
    }
};

export const getTMDBTrending = async (apiKey: string): Promise<SearchResult[]> => {
  const effectiveKey = getEffectiveApiKey(apiKey);
  if (!effectiveKey) return [];
  try {
    const response = await fetch(`${BASE_URL}/trending/all/week?api_key=${effectiveKey}&language=de-DE`);
    const data = await response.json();
    return data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 5)
      .map((item: any) => ({
        tmdbId: item.id,
        title: item.title || item.name,
        originalTitle: item.original_title || item.original_name,
        year: new Date(item.release_date || item.first_air_date || Date.now()).getFullYear() || 0,
        type: item.media_type === 'tv' ? MediaType.SERIES : MediaType.MOVIE,
        genre: mapGenres(item.genre_ids),
        plot: item.overview,
        rating: item.vote_average,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path
      }));
  } catch (e) {
    return [];
  }
};

export const getMediaDetails = async (item: SearchResult, apiKey: string): Promise<Partial<MediaItem>> => {
  const effectiveKey = getEffectiveApiKey(apiKey);
  if (!effectiveKey || !item.tmdbId) return {};

  const endpoint = item.type === MediaType.MOVIE ? 'movie' : 'tv';
  try {
    const appendToResponse = item.type === MediaType.MOVIE 
        ? 'videos,credits,release_dates,external_ids' 
        : 'videos,credits,content_ratings,external_ids';
        
    const detailsRes = await fetch(`${BASE_URL}/${endpoint}/${item.tmdbId}?api_key=${effectiveKey}&language=de-DE&append_to_response=${appendToResponse}&include_video_language=de,en`);
    if (!detailsRes.ok) throw new Error('Details fetch failed');
    const details = await detailsRes.json();

    const providersRes = await fetch(`${BASE_URL}/${endpoint}/${item.tmdbId}/watch/providers?api_key=${effectiveKey}`);
    const providersData = await providersRes.json();
    const deProviders = providersData.results?.DE;
    let providers: StreamingProvider[] = [];
    
    if (deProviders) {
      const all = [...(deProviders.flatrate || []), ...(deProviders.free || []), ...(deProviders.ads || [])];
      const uniqueIds = new Set();
      all.forEach((p: any) => {
        if (!uniqueIds.has(p.provider_id)) {
          uniqueIds.add(p.provider_id);
          providers.push({
            providerId: p.provider_id,
            providerName: p.provider_name,
            logoPath: p.logo_path
          });
        }
      });
    }

    const videos = details.videos?.results || [];
    const findVideo = (type: string, lang: string | null) => 
        videos.find((v: any) => v.site === "YouTube" && (type === "ANY" || v.type === type) && (lang === "ANY" || v.iso_639_1 === lang));

    let trailer = findVideo("Trailer", "de") || findVideo("Trailer", "en") || findVideo("Trailer", "ANY") ||
                  findVideo("Teaser", "de") || findVideo("Teaser", "en") || findVideo("Teaser", "ANY") ||
                  findVideo("Clip", "ANY") || findVideo("ANY", "ANY");

    const cast: CastMember[] = (details.credits?.cast || []).slice(0, 15).map((c: any) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profilePath: c.profile_path
    }));

    const result: Partial<MediaItem> = {
      posterPath: details.poster_path || item.posterPath, 
      backdropPath: details.backdrop_path || item.backdropPath,
      imdbId: details.imdb_id || details.external_ids?.imdb_id, 
      providers: providers.slice(0, 5),
      trailerKey: trailer?.key,
      runtime: item.type === MediaType.MOVIE ? details.runtime : (details.episode_run_time?.[0] || 0),
      creators: details.created_by?.map((c: any) => c.name) || [],
      credits: cast
    };

    if (item.type === MediaType.SERIES) {
      result.seasons = details.number_of_seasons;
      result.episodes = details.number_of_episodes;
    }
    return result;
  } catch (error) {
    console.error("Error fetching media details:", error);
    return {};
  }
};
