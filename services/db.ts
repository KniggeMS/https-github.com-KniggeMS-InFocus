
import { supabase } from './supabase';
import { MediaItem, CustomList, WatchStatus, User, UserRole, PublicReview } from '../types';

// MEDIA ITEMS CRUD

export const fetchMediaItems = async (): Promise<MediaItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from('media_items')
    .select('*')
    .order('added_at', { ascending: false });

  if (user) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching items:', error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    userId: item.user_id,
    tmdbId: item.tmdb_id,
    imdbId: item.imdb_id,
    title: item.title,
    originalTitle: item.original_title,
    year: item.year,
    type: item.type,
    genre: item.genre || [],
    plot: item.plot,
    rating: item.rating,
    rtScore: item.rt_score,
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

export const fetchPublicReviews = async (tmdbId: number): Promise<PublicReview[]> => {
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
        .neq('user_notes', null)
        .neq('user_notes', '')
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
    rt_score: item.rtScore,
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

  if (error) return null;
  return { ...item, id: data.id, userId: data.user_id };
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

export const updateMediaItemDetails = async (id: string, details: Partial<MediaItem>) => {
  const dbUpdates: any = {};
  if (details.runtime) dbUpdates.runtime = details.runtime;
  if (details.certification) dbUpdates.certification = details.certification;
  if (details.providers) dbUpdates.providers = details.providers;
  if (details.credits) dbUpdates.credits = details.credits;
  if (details.trailerKey) dbUpdates.trailer_key = details.trailerKey;
  if (details.rtScore) dbUpdates.rt_score = details.rtScore;
  
  await supabase.from('media_items').update(dbUpdates).eq('id', id);
};

export const deleteMediaItem = async (id: string) => {
  await supabase.from('media_items').delete().eq('id', id);
};

// CUSTOM LISTS CRUD

export const fetchCustomLists = async (): Promise<CustomList[]> => {
  const { data, error } = await supabase
    .from('custom_lists')
    .select('*');

  if (error) return [];

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

export const updateCustomList = async (listId: string, name: string) => {
    await supabase.from('custom_lists').update({ name }).eq('id', listId);
};

export const deleteCustomList = async (listId: string) => {
    await supabase.from('custom_lists').delete().eq('id', listId);
};

export const shareCustomList = async (listId: string, userIds: string[]) => {
    await supabase.from('custom_lists').update({ shared_with: userIds }).eq('id', listId);
};

// --- USER MANAGEMENT ---

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
        createdAt: new Date(p.created_at).getTime(),
        // NEW FIELDS
        loginCount: p.login_count || 0,
        lastLoginAt: p.last_login_at ? new Date(p.last_login_at).getTime() : undefined
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
    await supabase.from('media_items').delete().eq('user_id', userId);
    await supabase.from('custom_lists').delete().eq('owner_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);
};
    
    // --- ADMIN NOTIFICATIONS ---
    
    export const addAdminNotification = async (type: 'login' | 'register', message: string, userId: string) => {
      // This function should ideally be called from a secure context (e.g., a Supabase Edge Function)
      // that uses the service_role key to bypass RLS. For client-side simplicity, we assume RLS is set up
      // to allow inserts from authenticated users, but this is less secure.
      await supabase.from('admin_notifications').insert([{ type, message, user_id: userId }]);
    };
    
    export const fetchAdminNotifications = async (): Promise<{ id: string; message: string; created_at: string; }[]> => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('id, message, created_at')
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      return data;
    };
    
    export const markAdminNotificationsAsRead = async () => {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);
    };
    
