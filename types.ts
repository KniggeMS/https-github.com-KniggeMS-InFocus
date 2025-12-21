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

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  createdAt: number;
  role: UserRole;
  isStatsPublic: boolean;
  loginCount?: number;
  lastLoginAt?: number;
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
  userId?: string;
  tmdbId?: number;
  imdbId?: string;
  title: string;
  originalTitle?: string;
  year: number;
  type: MediaType;
  genre: string[];
  plot: string;
  rating: number;
  rtScore?: string;
  posterColor?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  status: WatchStatus;
  addedAt: number;
  seasons?: number;
  episodes?: number;
  runtime?: number;
  certification?: string;
  trailerKey?: string;
  budget?: number;
  revenue?: number;
  tagline?: string;
  productionStatus?: string;
  collectionName?: string;
  collectionParts?: string[];
  providers?: StreamingProvider[];
  creators?: string[];
  credits?: CastMember[];
  isFavorite?: boolean;
  userRating?: number;
  userNotes?: string;
}

export interface PublicReview {
    userId: string;
    username: string;
    avatar?: string;
    rating: number;
    content: string;
    date: number;
}

export interface CustomList {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  createdAt: number;
  items: string[];
  sharedWith: string[];
}

export interface SearchResult {
  tmdbId?: number;
  imdbId?: string;
  title: string;
  originalTitle?: string;
  year: number;
  type: MediaType;
  genre: string[];
  plot: string;
  rating: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  customNotes?: string;
  providers?: StreamingProvider[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  currentValue: number;
  targetValue: number;
}

export interface UserLevel {
  currentLevel: number;
  title: string;
  xp: number;
  nextLevelXp: number;
  progress: number;
}

export interface UserStats {
  totalRuntimeMinutes: number;
  moviesWatched: number;
  seriesWatched: number;
  totalRatings: number;
  favoritesCount: number;
  writtenReviews: number;
}