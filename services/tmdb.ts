
import { SearchResult, MediaType, MediaItem, StreamingProvider, CastMember } from '../types';

const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
export const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/original';

// Simple genre map for TMDB IDs (Standard standard genre list)
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
  if (!apiKey) return [];

  try {
    let url = `${BASE_URL}/search/multi?api_key=${apiKey}&language=de-DE&query=${encodeURIComponent(query)}&include_adult=false`;
    
    // TMDB Search doesn't support 'year' parameter directly in multi-search effectively for both types mixed, 
    // but we can try appending it to query or just filtering client side. 
    // However, specifically for movies/tv endpoints it exists. 
    // For simplicity in this robust multi-search, we stick to query. 
    // If specific year is crucial, we could use specific endpoints, but 'find' via OMDb is safer fallback.
    
    const response = await fetch(url);
    
    if (!response.ok) throw new Error('TMDB Search failed');
    
    const data = await response.json();

    let results = data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        tmdbId: item.id,
        title: item.title || item.name,
        year: new Date(item.release_date || item.first_air_date || Date.now()).getFullYear() || 0,
        type: item.media_type === 'tv' ? MediaType.SERIES : MediaType.MOVIE,
        genre: mapGenres(item.genre_ids),
        plot: item.overview || "Keine Beschreibung verfügbar.",
        rating: item.vote_average || 0,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path
      }));

      // Client-side year filter if provided strongly
      if (year) {
          const yearNum = parseInt(year);
          // Allow +/- 1 year tolerance
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
    if (!apiKey) return null;
    try {
        const response = await fetch(`${BASE_URL}/find/${externalId}?api_key=${apiKey}&external_source=imdb_id&language=de-DE`);
        const data = await response.json();

        // Check movie_results then tv_results
        let item = data.movie_results?.[0] || data.tv_results?.[0];
        
        if (!item) return null;

        const isTv = !!data.tv_results?.[0];

        return {
            tmdbId: item.id,
            imdbId: externalId,
            title: item.title || item.name,
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
  if (!apiKey) return [];
  try {
    const response = await fetch(`${BASE_URL}/trending/all/week?api_key=${apiKey}&language=de-DE`);
    const data = await response.json();
    return data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .slice(0, 5)
      .map((item: any) => ({
        tmdbId: item.id,
        title: item.title || item.name,
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

/**
 * Fetches detailed info including providers, seasons/episodes, trailers, certifications AND CREDITS.
 */
export const getMediaDetails = async (item: SearchResult, apiKey: string): Promise<Partial<MediaItem>> => {
  if (!apiKey || !item.tmdbId) return {};

  const endpoint = item.type === MediaType.MOVIE ? 'movie' : 'tv';
  
  try {
    // 1. Fetch Main Details with extensive appends
    // IMPORTANT: include_video_language=de,en is crucial to get trailers if no German one exists
    const appendToResponse = item.type === MediaType.MOVIE 
        ? 'videos,credits,release_dates' 
        : 'videos,credits,content_ratings';
        
    const detailsRes = await fetch(`${BASE_URL}/${endpoint}/${item.tmdbId}?api_key=${apiKey}&language=de-DE&append_to_response=${appendToResponse}&include_video_language=de,en`);
    
    if (!detailsRes.ok) throw new Error('Details fetch failed');
    
    const details = await detailsRes.json();

    // 2. Fetch Watch Providers (Germany)
    const providersRes = await fetch(`${BASE_URL}/${endpoint}/${item.tmdbId}/watch/providers?api_key=${apiKey}`);
    const providersData = await providersRes.json();
    
    // Extract providers for DE
    const deProviders = providersData.results?.DE;
    let providers: StreamingProvider[] = [];
    
    if (deProviders) {
      const flatrate = deProviders.flatrate || [];
      const free = deProviders.free || [];
      const ads = deProviders.ads || [];
      const all = [...flatrate, ...free, ...ads];
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

    // 3. Extract Trailer
    let trailerKey = undefined;
    const videos = details.videos?.results || [];
    
    // Improved Logic: Search aggressively for ANY video if preferred ones are missing
    const findVideo = (type: string, lang: string | null) => 
        videos.find((v: any) => 
            v.site === "YouTube" && 
            (type === "ANY" || v.type === type) && 
            (lang === "ANY" || v.iso_639_1 === lang)
        );

    // Priority Chain:
    // 1. German Trailer
    // 2. English Trailer
    // 3. Any Trailer
    // 4. German Teaser
    // 5. English Teaser
    // 6. Any Teaser
    // 7. Any Clip (Desperation)
    // 8. Any Video (Absolute Desperation to show *something*)
    
    let trailer = findVideo("Trailer", "de") || 
                  findVideo("Trailer", "en") || 
                  findVideo("Trailer", "ANY") ||
                  findVideo("Teaser", "de") ||
                  findVideo("Teaser", "en") ||
                  findVideo("Teaser", "ANY") ||
                  findVideo("Clip", "ANY") ||
                  findVideo("ANY", "ANY");

    if (trailer) trailerKey = trailer.key;

    // 4. Extract Certification (FSK)
    let certification = undefined;
    if (item.type === MediaType.MOVIE) {
        const releaseDates = details.release_dates?.results || [];
        const deRelease = releaseDates.find((r: any) => r.iso_3166_1 === "DE");
        if (deRelease) {
            const cert = deRelease.release_dates.find((d: any) => d.certification);
            if (cert) certification = cert.certification;
        }
    } else {
        const contentRatings = details.content_ratings?.results || [];
        const deRating = contentRatings.find((r: any) => r.iso_3166_1 === "DE");
        if (deRating) certification = deRating.rating;
    }

    // 5. Extract Cast
    const cast: CastMember[] = (details.credits?.cast || [])
        .slice(0, 15) // Top 15 actors
        .map((c: any) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profilePath: c.profile_path
        }));

    // 6. Construct result
    const result: Partial<MediaItem> = {
      // Use existing if details are null/empty, but usually API returns valid strings or null
      posterPath: details.poster_path || item.posterPath, 
      backdropPath: details.backdrop_path || item.backdropPath,
      imdbId: details.imdb_id, // Store IMDb ID if available
      
      providers: providers.slice(0, 5),
      trailerKey: trailerKey,
      certification: certification,
      runtime: item.type === MediaType.MOVIE ? details.runtime : (details.episode_run_time?.[0] || 0),
      creators: details.created_by?.map((c: any) => c.name) || [],
      credits: cast
    };

    if (item.type === MediaType.SERIES) {
      result.seasons = details.number_of_seasons;
      result.episodes = details.number_of_episodes;
    }

    if (item.type === MediaType.MOVIE && details.belongs_to_collection) {
      result.collectionName = details.belongs_to_collection.name;
    }

    return result;

  } catch (error) {
    console.error("Error fetching media details:", error);
    // Return empty object so we fallback to basic search info instead of breaking
    return {};
  }
};
