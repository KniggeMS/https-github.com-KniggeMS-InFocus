const OMDB_BASE_URL = 'https://www.omdbapi.com/';

/**
 * RFC-027: Hybride Key-Erkennung für OMDb.
 */
export const getEffectiveOmdbKey = (manualKey: string): string => {
  return import.meta.env.VITE_OMDB_API_KEY || manualKey;
};

export async function getOmdbRatings(imdbId: string, apiKey: string): Promise<string | null> {
  const effectiveKey = getEffectiveOmdbKey(apiKey);
  if (!effectiveKey || !imdbId) return null;

  try {
    const response = await fetch(`${OMDB_BASE_URL}?apikey=${effectiveKey}&i=${imdbId}`);
    const data = await response.json();

    if (data.Response === "True" && data.Ratings) {
      const rtRating = data.Ratings.find((r: any) => r.Source === "Rotten Tomatoes");
      return rtRating ? rtRating.Value : null;
    }
    return null;
  } catch (error) {
    console.error("OMDb Error:", error);
    return null;
  }
}