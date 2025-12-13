
import { supabase } from './supabase';
import { MediaItem, CustomList, WatchStatus, User, UserRole, PublicReview } from '../types';

// MEDIA ITEMS CRUD

export const fetchMediaItems = async (): Promise<MediaItem[]> => {
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching items:', error);
    return [];
  }

  // Map DB snake_case to TS camelCase
  return data.map((item: any) => ({
    id: item.id,
    tmdbId: item.tmdb_id,
    imdbId: item.imdb_id,
    title: item.title,
    originalTitle: item.original_title,
    year: item.year,
    type: item.type,
    genre: item.genre || [],
    plot: item.plot,
    rating: item.rating,
    rtScore: item.rt_score, // Added mapping
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    status: item.status,
    addedAt: item.added_at,
    seasons: item.seasons,
    episodes: item.episodes,
    runtime: item.runtime,
    certification: item.certification,
    trailerKey: item.trailer_key,
    collectionName: item.collection_name,
    creators: item.creators,
    isFavorite: item.is_favorite,
    userRating: item.user_rating,
    userNotes: item.user_notes,
    providers: item.providers,
    credits: item.credits
  }));
};

// NEW: Fetch reviews from OTHER users for a specific movie
export const fetchPublicReviews = async (tmdbId: number): Promise<PublicReview[]> => {
    // We select user_notes (the review), rating, and join the profiles table to get username/avatar
    const { data, error } = await supabase
        .from('media_items')
        .select(`
            user_id,
            user_notes,
            user_rating,
            added_at,
            profiles (username, avatar, is_stats_public)
        `)
        .eq('tmdb_id', tmdbId)
        .neq('user_notes', null) // Only where notes exist
        .neq('user_notes', '')   // And aren't empty
        .limit(20);

    if (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }

    return data.map((row: any) => ({
        userId: row.user_id,
        username: row.profiles?.username || 'Unknown',
        avatar: row.profiles?.avatar,
        rating: row.user_rating || 0,
        content: row.user_notes,
        date: row.added_at
    }));
};

export const addMediaItem = async (item: MediaItem, userId: string): Promise<MediaItem | null> => {
  const dbItem = {
    user_id: userId,
    tmdb_id: item.tmdbId,
    imdb_id: item.imdbId,
    title: item.title,
    original_title: item.originalTitle,
    year: item.year,
    type: item.type,
    genre: item.genre,
    plot: item.plot,
    rating: item.rating,
    rt_score: item.rtScore, // Added mapping
    poster_path: item.posterPath,
    backdrop_path: item.backdropPath,
    status: item.status,
    added_at: item.addedAt,
    seasons: item.seasons,
    episodes: item.episodes,
    runtime: item.runtime,
    certification: item.certification,
    trailer_key: item.trailerKey,
    collection_name: item.collectionName,
    creators: item.creators,
    is_favorite: item.isFavorite,
    user_rating: item.userRating,
    user_notes: item.userNotes,
    providers: item.providers,
    credits: item.credits
  };

  const { data, error } = await supabase
    .from('media_items')
    .insert([dbItem])
    .select()
    .single();

  if (error) {
    console.error('Error adding item:', error);
    return null;
  }
  return { ...item, id: data.id }; // Return with new UUID
};

export const updateMediaItemStatus = async (id: string, status: WatchStatus) => {
  await supabase.from('media_items').update({ status }).eq('id', id);
};

export const updateMediaItemRating = async (id: string, rating: number) => {
  await supabase.from('media_items').update({ user_rating: rating }).eq('id', id);
};

export const toggleMediaItemFavorite = async (id: string, isFavorite: boolean) => {
  await supabase.from('media_items').update({ is_favorite: isFavorite }).eq('id', id);
};

export const updateMediaItemNotes = async (id: string, notes: string) => {
  await supabase.from('media_items').update({ user_notes: notes }).eq('id', id);
};

export const updateMediaItemRtScore = async (id: string, score: string) => {
  await supabase.from('media_items').update({ rt_score: score }).eq('id', id);
};

export const deleteMediaItem = async (id: string) => {
  await supabase.from('media_items').delete().eq('id', id);
};

// CUSTOM LISTS CRUD

export const fetchCustomLists = async (): Promise<CustomList[]> => {
  const { data, error } = await supabase
    .from('custom_lists')
    .select('*');

  if (error) {
    console.error('Error fetching lists:', error);
    return [];
  }

  return data.map((l: any) => ({
    id: l.id,
    ownerId: l.owner_id,
    name: l.name,
    description: l.description,
    createdAt: l.created_at,
    items: l.items || [],
    sharedWith: l.shared_with || []
  }));
};

export const createCustomList = async (list: CustomList, userId: string): Promise<CustomList | null> => {
  const dbList = {
    owner_id: userId,
    name: list.name,
    description: list.description,
    created_at: list.createdAt,
    items: [],
    shared_with: []
  };

  const { data, error } = await supabase.from('custom_lists').insert([dbList]).select().single();
  if (error) return null;
  
  return {
      id: data.id,
      name: data.name,
      ownerId: data.owner_id,
      createdAt: data.created_at,
      items: [],
      sharedWith: []
  };
};

export const updateCustomListItems = async (listId: string, items: string[]) => {
    await supabase.from('custom_lists').update({ items }).eq('id', listId);
};

export const deleteCustomList = async (listId: string) => {
    await supabase.from('custom_lists').delete().eq('id', listId);
};

export const shareCustomList = async (listId: string, userIds: string[]) => {
    await supabase.from('custom_lists').update({ shared_with: userIds }).eq('id', listId);
};

// --- USER MANAGEMENT (ADMIN/MANAGER) ---

export const fetchAllProfiles = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((p: any) => ({
        id: p.id,
        username: p.username,
        email: p.email,
        avatar: p.avatar,
        firstName: p.first_name,
        lastName: p.last_name,
        role: p.role as UserRole,
        isStatsPublic: p.is_stats_public,
        createdAt: new Date(p.created_at).getTime()
    }));
};

export const updateUserRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
    
    if (error) throw error;
};

export const deleteUserProfile = async (userId: string) => {
    // Note: This deletes the profile row. In a full backend system,
    // this should also trigger deletion from auth.users via a Postgres trigger or Edge Function.
    // Client-side, we can only clean up the public data tables.
    
    // 1. Delete associated data (if not handled by cascade)
    await supabase.from('media_items').delete().eq('user_id', userId);
    await supabase.from('custom_lists').delete().eq('owner_id', userId);
    
    // 2. Delete Profile
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) throw error;
};
