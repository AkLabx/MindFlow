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
