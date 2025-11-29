
export enum WatchStatus {
  TO_WATCH = 'TO_WATCH',
  WATCHING = 'WATCHING',
  WATCHED = 'WATCHED',
}

export enum MediaType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

export enum SortOption {
  DATE_ADDED = 'DATE_ADDED',
  RATING = 'RATING',
  YEAR = 'YEAR',
  TITLE = 'TITLE',
}

export type Language = 'de' | 'en';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string; // Base64 or URL
  firstName?: string;
  lastName?: string;
  createdAt: number;
}

export interface StreamingProvider {
  providerId: number;
  providerName: string;
  logoPath: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface MediaItem {
  id: string;
  tmdbId?: number;
  imdbId?: string; // New: Link to IMDb
  title: string;
  originalTitle?: string;
  year: number;
  type: MediaType;
  genre: string[];
  plot: string;
  rating: number; // 0-10
  posterColor?: string; // Fallback
  posterPath?: string | null;
  backdropPath?: string | null;
  status: WatchStatus;
  addedAt: number;
  
  // Extended Details
  seasons?: number;
  episodes?: number;
  runtime?: number; // Minutes
  certification?: string; // FSK e.g. "16"
  trailerKey?: string; // YouTube ID
  collectionName?: string; // Für Filme (z.B. "Avengers Collection")
  collectionParts?: string[]; // Liste der anderen Teile
  providers?: StreamingProvider[]; // Streaming Anbieter (Flatrate & Free)
  creators?: string[]; // Created by names
  credits?: CastMember[]; // Actors
  
  // User Interactions
  isFavorite?: boolean;
  userRating?: number; // 1-5 User Rating
  userNotes?: string; // Private Notizen für ML Analyse
}

export interface CustomList {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  createdAt: number;
  items: string[]; // Array of MediaItem IDs
  sharedWith: string[]; // Array of User IDs
}

export interface SearchResult {
  tmdbId?: number;
  imdbId?: string; // New: Support for OMDb matches
  title: string;
  year: number;
  type: MediaType;
  genre: string[];
  plot: string;
  rating: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  // Temporary fields for Import logic
  customNotes?: string;
}

export interface GenreStat {
  name: string;
  value: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
