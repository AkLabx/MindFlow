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
  profiles?: { full_name: string | null; avatar_url: string | null };
  likes_count?: number;
  comments_count?: number;
  is_liked_by_me?: boolean;
};

export const fetchPosts = async (limit = 20, cursor?: string): Promise<Post[]> => {
  try {
  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(full_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: postsData, error: postsError } = await query;

  if (postsError) throw postsError;

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
