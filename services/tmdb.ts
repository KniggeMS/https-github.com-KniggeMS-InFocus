import { SearchResult, MediaItem, MediaType } from '../types';

const BASE_URL = 'https://api.themoviedb.org/3';

/**
 * RFC-027: Priorisiert den System-Key (Vercel) vor dem manuellen Key.
 */
export const getEffectiveApiKey = (manualKey: string): string => {
  return import.meta.env.VITE_TMDB_API_KEY || manualKey;
};

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
        genre: [], // Wird bei Details nachgeladen
        plot: item.overview,
        rating: item.vote_average,
        posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
      }));
  } catch (error) {
    console.error("TMDB Search Error:", error);
    return [];
  }
}

export async function getMediaDetails(item: SearchResult, apiKey: string): Promise<Partial<MediaItem>> {
  const effectiveKey = getEffectiveApiKey(apiKey);
  const typePath = item.type === MediaType.SERIES ? 'tv' : 'movie';
  
  try {
    const response = await fetch(
      `${BASE_URL}/${typePath}/${item.tmdbId}?api_key=${effectiveKey}&language=de-DE&append_to_response=videos,credits,watch/providers`
    );
    const data = await response.json();

    return {
      runtime: data.runtime || (data.episode_run_time ? data.episode_run_time[0] : 0),
      genres: data.genres?.map((g: any) => g.name) || [],
      certification: data.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'DE')?.release_dates[0]?.certification,
      trailerKey: data.videos?.results?.find((v: any) => v.type === 'Trailer')?.key,
      credits: data.credits?.cast?.slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
      }))
    };
  } catch (error) {
    return {};
  }
}