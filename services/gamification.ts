
import { MediaItem, WatchStatus, MediaType, Achievement, UserLevel, UserStats } from '../types';

// XP Calculation: 1 Minute Runtime = 1 XP. 
// Fallback if runtime missing: Movie = 120 XP, Series = 400 XP (approx 1 season)

const LEVEL_THRESHOLDS = [
    { level: 1, xp: 0, title: "Statist" }, // Extra
    { level: 2, xp: 500, title: "Filmklappen-Halter" }, // Clapper Loader
    { level: 3, xp: 1500, title: "Kamerassistent" }, // Camera Assistant
    { level: 4, xp: 3000, title: "Cineast" }, // Cinephile
    { level: 5, xp: 6000, title: "Drehbuchautor" }, // Screenwriter
    { level: 6, xp: 10000, title: "Film-Kritiker" }, // Critic
    { level: 7, xp: 18000, title: "Regisseur" }, // Director
    { level: 8, xp: 30000, title: "Produzent" }, // Producer
    { level: 9, xp: 50000, title: "Studio Boss" }, // Studio Head
    { level: 10, xp: 100000, title: "Hollywood Legende" } // Legend
];

// Extend interface to include collection count
export interface ExtendedUserStats extends UserStats {
    collectionSize: number;
}

export const calculateUserStats = (items: MediaItem[]): ExtendedUserStats => {
    const watchedItems = items.filter(i => i.status === WatchStatus.WATCHED);
    
    let totalRuntime = 0;
    let movies = 0;
    let series = 0;

    watchedItems.forEach(item => {
        if (item.type === MediaType.MOVIE) {
            movies++;
            totalRuntime += item.runtime || 120; // Fallback 2h
        } else {
            series++;
            // Estimate series runtime: (runtime per ep * eps * seasons) OR fallback
            const epRuntime = item.runtime || 45;
            const eps = item.episodes || 10;
            const seasons = item.seasons || 1;
            // If we have precise data use it, otherwise fallback to 400 mins per entry
            if (item.episodes) {
                totalRuntime += (epRuntime * eps); 
            } else {
                totalRuntime += 400; 
            }
        }
    });

    return {
        totalRuntimeMinutes: totalRuntime,
        moviesWatched: movies,
        seriesWatched: series,
        totalRatings: items.filter(i => i.userRating && i.userRating > 0).length,
        favoritesCount: items.filter(i => i.isFavorite).length,
        collectionSize: items.length,
        writtenReviews: items.filter(i => i.userNotes && i.userNotes.trim().length > 0).length
    };
};

export const calculateLevel = (stats: UserStats): UserLevel => {
    // XP Calculation: Runtime + (Reviews * 100 Bonus)
    const xp = stats.totalRuntimeMinutes + (stats.writtenReviews * 100); 
    
    // Find current level
    let currentLevelIdx = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i].xp) {
            currentLevelIdx = i;
        } else {
            break;
        }
    }

    const currentData = LEVEL_THRESHOLDS[currentLevelIdx];
    const nextData = LEVEL_THRESHOLDS[currentLevelIdx + 1];

    let progress = 100;
    let nextXp = xp; // Maxed out

    if (nextData) {
        const range = nextData.xp - currentData.xp;
        const currentInLevel = xp - currentData.xp;
        progress = Math.min(100, Math.max(0, (currentInLevel / range) * 100));
        nextXp = nextData.xp;
    }

    return {
        currentLevel: currentData.level,
        title: currentData.title,
        xp,
        nextLevelXp: nextXp,
        progress
    };
};

export const getAchievements = (items: MediaItem[], stats: UserStats): Achievement[] => {
    const watched = items.filter(i => i.status === WatchStatus.WATCHED);
    
    // Helper to count genre occurrences
    const genreCounts: Record<string, number> = {};
    watched.forEach(i => {
        i.genre.forEach(g => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
    });
    const maxGenreCount = Math.max(0, ...Object.values(genreCounts));

    // Old movies check (< 1990)
    const oldiesCount = watched.filter(i => i.year < 1990).length;

    return [
        {
            id: 'first_blood',
            icon: 'Popcorn',
            currentValue: watched.length,
            targetValue: 1,
            progress: Math.min(100, (watched.length / 1) * 100),
            unlocked: watched.length >= 1
        },
        {
            id: 'collector_novice',
            icon: 'Library',
            currentValue: items.length, // Total collection size
            targetValue: 10,
            progress: Math.min(100, (items.length / 10) * 100),
            unlocked: items.length >= 10
        },
        {
            id: 'binge_master',
            icon: 'Tv',
            currentValue: stats.seriesWatched,
            targetValue: 5,
            progress: Math.min(100, (stats.seriesWatched / 5) * 100),
            unlocked: stats.seriesWatched >= 5
        },
        {
            id: 'critic',
            icon: 'Star',
            currentValue: stats.totalRatings,
            targetValue: 10,
            progress: Math.min(100, (stats.totalRatings / 10) * 100),
            unlocked: stats.totalRatings >= 10
        },
        {
            id: 'genre_guru',
            icon: 'BrainCircuit',
            currentValue: maxGenreCount,
            targetValue: 10, // Watched 10 of same genre
            progress: Math.min(100, (maxGenreCount / 10) * 100),
            unlocked: maxGenreCount >= 10
        },
        {
            id: 'time_traveler',
            icon: 'Hourglass',
            currentValue: oldiesCount,
            targetValue: 5,
            progress: Math.min(100, (oldiesCount / 5) * 100),
            unlocked: oldiesCount >= 5
        },
        {
            id: 'marathon_runner',
            icon: 'Timer',
            currentValue: Math.floor(stats.totalRuntimeMinutes / 60), // In Hours
            targetValue: 100, // 100 Hours
            progress: Math.min(100, (Math.floor(stats.totalRuntimeMinutes / 60) / 100) * 100),
            unlocked: stats.totalRuntimeMinutes / 60 >= 100
        }
    ];
};
