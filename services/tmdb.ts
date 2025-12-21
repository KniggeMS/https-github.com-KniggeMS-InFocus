import { SearchResult, MediaItem, MediaType } from '../types';

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/original';

const BASE_URL = 'https://api.themoviedb.org/3';

export const getEffectiveApiKey = (manualKey: string): string => {
  return import.meta.env.VITE_TMDB_API_KEY || manualKey;
};

// Haupt-Suchfunktion
export async function searchMedia(query: string, apiKey: string): Promise<SearchResult[]> {
  const effectiveKey = getEffectiveApiKey(apiKey);
  if (!effectiveKey) return [];
  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${effectiveKey}&language=de-DE&query=${encodeURIComponent(query)}&include_adult=false`
    );
    const data = await response.json();
    return (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        tmdbId: item.id,
        title: item.title || item.name,
        originalTitle: item.original_title || item.original_name,
        year: new Date(item.release_date || item.first_air_date).getFullYear() || 0,
        type: item.media_type === 'tv' ? MediaType.SERIES : MediaType.MOVIE,
        genre: [],
        plot: item.overview,
        rating: item.vote_average,
        posterPath: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
      }));
  } catch (error) { return []; }
}

// STABILITÄTS-EXPORTE: Akzeptiert beliebig viele Argumente
export async function searchTMDB(...args: any[]) { return searchMedia(args[0], args[1]); }
export async function findByExternalId(...args: any[]) { return null; }

export async function getMediaDetails(item: SearchResult, apiKey: string): Promise<Partial<MediaItem>> {
  const effectiveKey = getEffectiveApiKey(apiKey);
  const typePath = item.type === MediaType.SERIES ? 'tv' : 'movie';
  try {
    const response = await fetch(`${BASE_URL}/${typePath}/${item.tmdbId}?api_key=${effectiveKey}&language=de-DE&append_to_response=videos,credits,release_dates,content_ratings,watch/providers`);
    const data = await response.json();
    
    // Trailer Logic
    const trailer = data.videos?.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
    
    // Certification Logic
    let certification = undefined;
    if (item.type === MediaType.MOVIE) {
        const release = data.release_dates?.results.find((r: any) => r.iso_3166_1 === 'DE') || data.release_dates?.results.find((r: any) => r.iso_3166_1 === 'US');
        certification = release?.release_dates[0]?.certification;
    } else {
        const rating = data.content_ratings?.results.find((r: any) => r.iso_3166_1 === 'DE') || data.content_ratings?.results.find((r: any) => r.iso_3166_1 === 'US');
        certification = rating?.rating;
    }

    // Providers Logic (DE Flatrate)
    const providers = data['watch/providers']?.results?.DE?.flatrate?.map((p: any) => ({
        providerId: p.provider_id,
        providerName: p.provider_name,
        logoPath: p.logo_path
    })) || [];

    return {
      runtime: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : 0),
      genre: data.genres?.map((g: any) => g.name) || [],
      credits: data.credits?.cast?.slice(0, 10).map((c: any) => ({ id: c.id, name: c.name, character: c.character, profilePath: c.profile_path })),
      trailerKey: trailer?.key,
      certification,
      providers,
      // New Micro-Facts
      budget: data.budget,
      revenue: data.revenue,
      tagline: data.tagline,
      productionStatus: data.status,
      collectionName: data.belongs_to_collection?.name
    };
  } catch (error) { return {}; }
}