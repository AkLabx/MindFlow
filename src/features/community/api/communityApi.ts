import { supabase } from '../../../lib/supabase';

export type Post = {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  hls_stream_url: string | null;
  type: 'text' | 'image' | 'video' | 'reel';
  created_at: string;
  updated_at: string;
  profiles?: { id?: string; full_name: string | null; avatar_url: string | null };
  likes_count?: number;
  comments_count?: number;
  is_liked_by_me?: boolean;
};

export type SearchProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  similarity: number;
  is_following?: boolean;
};

export const fetchPosts = async (limit = 20, cursor?: string): Promise<Post[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    let followingIds: string[] = [];

    // Attempt to fetch from following list first
    if (user) {
        const { data: followersData } = await supabase
            .from('user_followers')
            .select('following_id')
            .eq('follower_id', user.id);

        if (followersData && followersData.length > 0) {
            followingIds = followersData.map(f => f.following_id);
            // Optionally, include the user's own posts
            followingIds.push(user.id);
        }
    }

    let postsData: any[] = [];

    // If following someone, fetch their posts
    if (followingIds.length > 0) {
        let q = supabase
            .from('posts')
            .select(`
            *,
            profiles:user_id(id, full_name, avatar_url)
            `)
            .in('user_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (cursor) q = q.lt('created_at', cursor);
        const res = await q;
        postsData = res.data || [];
    }

    // Cold Start Fallback: If no posts from following or empty feed, fetch globally trending/recent
    if (!postsData || postsData.length === 0) {
        let fallbackQuery = supabase
            .from('posts')
            .select(`
            *,
            profiles:user_id(id, full_name, avatar_url)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (cursor) fallbackQuery = fallbackQuery.lt('created_at', cursor);

        const fallbackRes = await fallbackQuery;
        postsData = fallbackRes.data || [];
    }

    if (!postsData || postsData.length === 0) return [];

    const postIds = postsData.map((p: any) => p.id);

    const [likesReq, commentsReq, myLikesReq] = await Promise.all([
      supabase.from('post_likes').select('post_id', { count: 'exact' }).in('post_id', postIds),
      supabase.from('post_comments').select('post_id', { count: 'exact' }).in('post_id', postIds),
      user ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] })
    ]);

    const likesCountMap = (likesReq.data || []).reduce((acc: any, curr: any) => {
      acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
      return acc;
    }, {});

    const commentsCountMap = (commentsReq.data || []).reduce((acc: any, curr: any) => {
      acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
      return acc;
    }, {});

    const myLikedPostIds = new Set((myLikesReq.data || []).map((l: any) => l.post_id));

    return postsData.map((p: any) => ({
      ...p,
      profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
      likes_count: likesCountMap[p.id] || 0,
      comments_count: commentsCountMap[p.id] || 0,
      is_liked_by_me: myLikedPostIds.has(p.id)
    }));
  } catch (err) {
    console.error('Fetch posts error:', err);
    return [];
  }
};

export const toggleLikePost = async (postId: string, userId: string, currentlyLiked: boolean) => {
  if (currentlyLiked) {
    return await supabase.from('post_likes').delete().match({ post_id: postId, user_id: userId });
  } else {
    return await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
  }
};

export const searchProfiles = async (query: string, currentUserId?: string): Promise<SearchProfile[]> => {
    if (!query.trim()) return [];

    try {
        const { data, error } = await supabase.rpc('search_profiles_trgm', {
            search_query: query,
            limit_num: 20
        });

        if (error) throw error;

        let results = data as SearchProfile[];

        // Exclude the current user from search results
        if (currentUserId) {
            results = results.filter(p => p.id !== currentUserId);
        }

        // Fetch following status
        if (currentUserId && results.length > 0) {
            const profileIds = results.map(p => p.id);
            const { data: follows } = await supabase
                .from('user_followers')
                .select('following_id')
                .eq('follower_id', currentUserId)
                .in('following_id', profileIds);

            const followingSet = new Set(follows?.map(f => f.following_id) || []);
            results = results.map(p => ({
                ...p,
                is_following: followingSet.has(p.id)
            }));
        }

        return results;
    } catch (err) {
        console.error('Search error:', err);
        return [];
    }
};

export const toggleFollow = async (followerId: string, followingId: string, currentlyFollowing: boolean) => {
    if (currentlyFollowing) {
        return await supabase.from('user_followers')
            .delete()
            .match({ follower_id: followerId, following_id: followingId });
    } else {
        return await supabase.from('user_followers')
            .insert({ follower_id: followerId, following_id: followingId });
    }
};

export const createPost = async (userId: string, content: string, type: 'text' | 'image' | 'video' = 'text', file?: File) => {
    let media_url = null;

    if (file && (type === 'image' || type === 'video')) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Assuming chat_media bucket is generic enough, or post_media
        const { error: uploadError } = await supabase.storage
            .from('chat_media')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('chat_media')
            .getPublicUrl(filePath);

        media_url = data.publicUrl;
    }

    const { data, error } = await supabase.from('posts').insert({
        user_id: userId,
        content: content.trim() ? content.trim() : null,
        type,
        media_url
    }).select().single();

    if (error) throw error;
    return data;
};


export type UserProfileDetails = {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    followers_count: number;
    following_count: number;
    is_following: boolean;
};

export const fetchUserProfile = async (profileId: string, currentUserId?: string): Promise<UserProfileDetails | null> => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, created_at')
            .eq('id', profileId)
            .single();

        if (error || !profile) return null;

        const [followersReq, followingReq, isFollowingReq] = await Promise.all([
            supabase.from('user_followers').select('follower_id', { count: 'exact' }).eq('following_id', profileId),
            supabase.from('user_followers').select('following_id', { count: 'exact' }).eq('follower_id', profileId),
            currentUserId ? supabase.from('user_followers').select('follower_id').match({ follower_id: currentUserId, following_id: profileId }).single() : Promise.resolve({ data: null })
        ]);

        return {
            ...profile,
            followers_count: followersReq.count || 0,
            following_count: followingReq.count || 0,
            is_following: !!isFollowingReq.data
        };
    } catch (err) {
        console.error('Fetch user profile error:', err);
        return null;
    }
};

export const fetchUserPosts = async (profileId: string, limit = 20): Promise<Post[]> => {
    try {
        const { data: postsData, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles:user_id(id, full_name, avatar_url)
            `)
            .eq('user_id', profileId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        if (!postsData || postsData.length === 0) return [];

        const postIds = postsData.map((p: any) => p.id);
        const { data: { user } } = await supabase.auth.getUser();

        const [likesReq, commentsReq, myLikesReq] = await Promise.all([
            supabase.from('post_likes').select('post_id', { count: 'exact' }).in('post_id', postIds),
            supabase.from('post_comments').select('post_id', { count: 'exact' }).in('post_id', postIds),
            user ? supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds) : Promise.resolve({ data: [] })
        ]);

        const likesCountMap = (likesReq.data || []).reduce((acc: any, curr: any) => {
            acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
            return acc;
        }, {});

        const commentsCountMap = (commentsReq.data || []).reduce((acc: any, curr: any) => {
            acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
            return acc;
        }, {});

        const myLikedPostIds = new Set((myLikesReq.data || []).map((l: any) => l.post_id));

        return postsData.map((p: any) => ({
            ...p,
            profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
            likes_count: likesCountMap[p.id] || 0,
            comments_count: commentsCountMap[p.id] || 0,
            is_liked_by_me: myLikedPostIds.has(p.id)
        }));
    } catch (err) {
        console.error('Fetch user posts error:', err);
        return [];
    }
};

export const getOrCreateChatRoom = async (user1Id: string, user2Id: string): Promise<string | null> => {
    try {
        // Find existing direct chat room
        const { data: rooms1 } = await supabase.from('chat_participants').select('room_id').eq('user_id', user1Id);
        const { data: rooms2 } = await supabase.from('chat_participants').select('room_id').eq('user_id', user2Id);

        if (rooms1 && rooms2) {
            const r1Ids = new Set(rooms1.map(r => r.room_id));
            const commonRoom = rooms2.find(r => r1Ids.has(r.room_id));
            if (commonRoom) {
                // verify it's a direct room
                const { data: roomDetails } = await supabase.from('chat_rooms').select('type').eq('id', commonRoom.room_id).single();
                if (roomDetails && roomDetails.type === 'direct') {
                    return commonRoom.room_id;
                }
            }
        }

        // Create new room
        const { data: newRoom, error: roomError } = await supabase.from('chat_rooms').insert({ type: 'direct' }).select('id').single();
        if (roomError || !newRoom) throw roomError;

        // Add participants
        await supabase.from('chat_participants').insert([
            { room_id: newRoom.id, user_id: user1Id },
            { room_id: newRoom.id, user_id: user2Id }
        ]);

        return newRoom.id;
    } catch (err) {
        console.error('Error getting/creating chat room:', err);
        return null;
    }
};
