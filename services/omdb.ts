import { MediaType } from '../types';

interface OMDbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

interface OMDbResponse {
  Search?: OMDbSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

interface OMDbDetailResponse {
    Ratings?: { Source: string; Value: string }[];
    imdbRating?: string;
    Response: string;
}

/**
 * AUTOMATISCHE KEY-ERKENNUNG für OMDb:
 * Priorität: 1. Übergebener Key, 2. Vercel/Vite Env, 3. LocalStorage
 */
export const getEffectiveOmdbKey = (providedKey?: string): string => {
  const envKey = import.meta.env.VITE_OMDB_API_KEY; 
  return providedKey || envKey || localStorage.getItem('omdb_api_key') || '';
};

export const searchOMDB = async (query: string, year: string | null, type: MediaType | undefined, apiKey: string): Promise<OMDbSearchResult | null> => {
  const effectiveKey = getEffectiveOmdbKey(apiKey);
  if (!effectiveKey) return null;

  try {
    let url = `https://www.omdbapi.com/?apikey=${effectiveKey}&s=${encodeURIComponent(query)}`;
    
    if (year) {
      url += `&y=${year}`;
    }

    if (type) {
        const omdbType = type === MediaType.MOVIE ? 'movie' : 'series';
        url += `&type=${omdbType}`;
    }

    const res = await fetch(url);
    const data: OMDbResponse = await res.json();

    if (data.Response === "True" && data.Search && data.Search.length > 0) {
      return data.Search[0];
    }
    
    if (data.Error === "Request limit reached!") {
        throw new Error("LIMIT_REACHED");
    }

    return null;
  } catch (error: any) {
    if (error.message === "LIMIT_REACHED") throw error;
    console.error("OMDb API Error:", error);
    return null;
  }
};

export const getOmdbRatings = async (imdbId: string, apiKey: string): Promise<string | undefined> => {
    const effectiveKey = getEffectiveOmdbKey(apiKey);
    if (!effectiveKey || !imdbId) return undefined;

    try {
        const url = `https://www.omdbapi.com/?apikey=${effectiveKey}&i=${imdbId}`;
        const res = await fetch(url);
        const data: OMDbDetailResponse = await res.json();

        if (data.Response === "True") {
            const rt = data.Ratings?.find(r => r.Source === "Rotten Tomatoes");
            if (rt) return rt.Value;

            const imdbInRatings = data.Ratings?.find(r => r.Source === "Internet Movie Database");
            if (imdbInRatings) return imdbInRatings.Value;
            
            if (data.imdbRating && data.imdbRating !== "N/A") return `${data.imdbRating}/10`;
        }
        return undefined;
    } catch (e) {
        console.error("OMDb Rating Fetch Error:", e);
        return undefined;
    }
};
