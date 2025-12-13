
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

export const searchOMDB = async (query: string, year: string | null, type: MediaType | undefined, apiKey: string): Promise<OMDbSearchResult | null> => {
  if (!apiKey) return null;

  try {
    let url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(query)}`;
    
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
      // Return the first match
      return data.Search[0];
    }
    
    // Explicitly throw if limit is reached so consumer can stop asking
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

/**
 * Fetches Rotten Tomatoes rating specifically using IMDb ID.
 * Fallback to IMDb Rating if RT is missing (common for Series).
 */
export const getOmdbRatings = async (imdbId: string, apiKey: string): Promise<string | undefined> => {
    if (!apiKey || !imdbId) return undefined;

    try {
        const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}`;
        const res = await fetch(url);
        const data: OMDbDetailResponse = await res.json();

        if (data.Response === "True") {
            // Priority 1: Rotten Tomatoes
            const rt = data.Ratings?.find(r => r.Source === "Rotten Tomatoes");
            if (rt) return rt.Value;

            // Priority 2: IMDb (Fallback for Series)
            // Sometimes it's in Ratings array, sometimes top level property
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
