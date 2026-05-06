import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, UserCheck, MessageSquare, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { fetchUserProfile, fetchUserPosts, toggleFollow, getOrCreateChatRoom } from '../api/communityApi';
import { useAuth } from '../../auth/context/AuthContext';
import { cn } from '../../../utils/cn';

export const UserProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['user-profile', id, currentUser?.id],
        queryFn: () => fetchUserProfile(id!, currentUser?.id),
        enabled: !!id,
    });

    const { data: posts, isLoading: isPostsLoading } = useQuery({
        queryKey: ['user-posts', id],
        queryFn: () => fetchUserPosts(id!),
        enabled: !!id,
    });

    const toggleFollowMutation = useMutation({
        mutationFn: () => toggleFollow(currentUser!.id, id!, !!profile?.is_following),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile', id, currentUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['community-search'] });
        }
    });

    const messageMutation = useMutation({
        mutationFn: () => getOrCreateChatRoom(currentUser!.id, id!),
        onSuccess: (roomId) => {
            if (roomId) {
                // Navigate to messages, perhaps passing room ID or assuming chat screen loads recent
                // The current ChatRooms component uses activeRoomId local state.
                // We'll navigate to /messages and in a real app would pass the ID via state.
                navigate('/messages', { state: { roomId } });
            }
        }
    });

    const isOwnProfile = currentUser?.id === id;

    if (isProfileLoading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Profile...</div>;
    }

    if (!profile) {
        return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
            <h2 className="text-xl mb-4">User not found</h2>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-800 rounded-lg text-white">Go Back</button>
        </div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 p-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="font-semibold text-lg">{profile.full_name || 'User'}</div>
            </div>

            {/* Profile Info */}
            <div className="p-6 flex flex-col items-center border-b border-white/5 bg-gradient-to-b from-blue-900/10 to-transparent">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-blue-500/20 overflow-hidden">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                        (profile.full_name || 'U').charAt(0).toUpperCase()
                    )}
                </div>

                <h1 className="text-2xl font-bold mb-1">{profile.full_name}</h1>
                <p className="text-slate-400 text-sm mb-6">Joined {new Date(profile.created_at).toLocaleDateString()}</p>

                <div className="flex gap-8 mb-6 text-center">
                    <div>
                        <div className="font-bold text-xl">{posts?.length || 0}</div>
                        <div className="text-slate-400 text-sm">Posts</div>
                    </div>
                    <div>
                        <div className="font-bold text-xl">{profile.followers_count}</div>
                        <div className="text-slate-400 text-sm">Followers</div>
                    </div>
                    <div>
                        <div className="font-bold text-xl">{profile.following_count}</div>
                        <div className="text-slate-400 text-sm">Following</div>
                    </div>
                </div>

                {!isOwnProfile && (
                    <div className="flex gap-3 w-full max-w-xs">
                        <button
                            onClick={() => toggleFollowMutation.mutate()}
                            disabled={toggleFollowMutation.isPending}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                                profile.is_following
                                    ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                                    : "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500"
                            )}
                        >
                            {profile.is_following ? <><UserCheck size={18} /> Following</> : <><UserPlus size={18} /> Follow</>}
                        </button>
                        <button
                            onClick={() => messageMutation.mutate()}
                            disabled={messageMutation.isPending}
                            className="flex-1 py-2.5 bg-white/10 text-white hover:bg-white/20 border border-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={18} /> Message
                        </button>
                    </div>
                )}
            </div>

            {/* Posts Grid/List */}
            <div className="flex-1 p-4">
                <h2 className="text-lg font-semibold mb-4 text-slate-200">Posts</h2>
                {isPostsLoading ? (
                    <div className="flex justify-center mt-10">
                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : posts && posts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {posts.map((post, i) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                key={post.id}
                                className="aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden relative group cursor-pointer hover:border-blue-500/50 transition-colors"
                            >
                                {post.media_url ? (
                                    <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full p-3 flex items-center justify-center text-center bg-gradient-to-br from-slate-800 to-slate-900">
                                        <p className="text-xs sm:text-sm line-clamp-4 text-slate-300 font-medium">{post.content}</p>
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white">
                                    {post.type === 'video' || post.type === 'reel' ? <Video size={14} /> :
                                     post.type === 'image' ? <ImageIcon size={14} /> :
                                     <FileText size={14} />}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 mt-10">
                        No posts yet.
                    </div>
                )}
            </div>
        </div>
    );
};
