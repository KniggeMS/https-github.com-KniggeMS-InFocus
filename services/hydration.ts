
import { MediaItem } from '../types';
import { getMediaDetails } from './tmdb';
import { getOmdbRatings } from './omdb';
import { updateMediaItemDetails, updateMediaItemRtScore } from './db';

const HYDRATION_LIMIT = 5; // Max 5 items per run to respect API limits

export const hydrateMissingData = async (
    items: MediaItem[], 
    tmdbKey: string, 
    omdbKey: string | null
): Promise<MediaItem[]> => {
    if (!tmdbKey) return [];

    // Find candidates for hydration (missing runtime OR missing certification OR missing RT score)
    const candidates = items.filter(item => {
        const missingCore = !item.runtime || !item.certification || (!item.providers || item.providers.length === 0);
        const missingRt = omdbKey && item.imdbId && !item.rtScore;
        return missingCore || missingRt;
    });

    if (candidates.length === 0) return [];

    // Process only a few items to avoid rate limiting issues
    const batch = candidates.slice(0, HYDRATION_LIMIT);
    const updatedItems: MediaItem[] = [];

    for (const item of batch) {
        let hasChanges = false;
        let updatedItem = { ...item };

        // 1. Hydrate Core Details via TMDB
        if (!item.runtime || !item.certification || (!item.providers || item.providers.length === 0)) {
            try {
                // We construct a minimal SearchResult object because getMediaDetails expects one
                const searchResultStub = {
                    tmdbId: item.tmdbId,
                    type: item.type,
                    title: item.title,
                    originalTitle: item.originalTitle,
                    year: item.year,
                    genre: [], // irrelevant for fetch
                    plot: '',
                    rating: 0
                };
                
                const details = await getMediaDetails(searchResultStub, tmdbKey);
                
                if (details) {
                    await updateMediaItemDetails(item.id, details);
                    updatedItem = { ...updatedItem, ...details };
                    hasChanges = true;
                    console.log(`💧 Hydrated TMDB details for: ${item.title}`);
                }
            } catch (e) {
                console.error(`Failed to hydrate TMDB for ${item.title}`, e);
            }
        }

        // 2. Hydrate RT Score via OMDb
        if (omdbKey && item.imdbId && !item.rtScore) {
            try {
                const rtScore = await getOmdbRatings(item.imdbId, omdbKey);
                if (rtScore) {
                    await updateMediaItemRtScore(item.id, rtScore);
                    updatedItem.rtScore = rtScore;
                    hasChanges = true;
                    console.log(`🍅 Hydrated RT Score for: ${item.title}`);
                }
            } catch (e) {
                console.error(`Failed to hydrate OMDb for ${item.title}`, e);
            }
        }

        if (hasChanges) {
            updatedItems.push(updatedItem);
        }
    }
    
    return updatedItems;
};
