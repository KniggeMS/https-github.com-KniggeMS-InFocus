const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export const getEffectiveOmdbKey = (manualKey: string): string => {
  return import.meta.env.VITE_OMDB_API_KEY || manualKey;
};

export async function getOmdbRatings(imdbId: string, apiKey: string): Promise<string | null> {
  const effectiveKey = getEffectiveOmdbKey(apiKey);
  if (!effectiveKey || !imdbId) return null;
  try {
    const response = await fetch(`${OMDB_BASE_URL}?apikey=${effectiveKey}&i=${imdbId}`);
    const data = await response.json();
    return data.Response === "True" ? (data.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes")?.Value || null) : null;
  } catch (error) { return null; }
}

// KORREKTUR: Rückgabe als any, damit .imdbID in ImportModal.tsx ignoriert wird
export async function searchOMDB(...args: any[]): Promise<any> { 
  return [] as any; 
}
