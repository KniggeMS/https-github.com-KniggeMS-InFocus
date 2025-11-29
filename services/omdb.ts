
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
