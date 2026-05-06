import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, UserPlus, UserCheck, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchProfiles, toggleFollow, SearchProfile } from '../api/communityApi';
import { useAuth } from '../../auth/context/AuthContext';
import { cn } from '../../../utils/cn';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export const CommunitySearch: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: results, isLoading, isError } = useQuery({
        queryKey: ['community-search', debouncedSearch, user?.id],
        queryFn: () => searchProfiles(debouncedSearch, user?.id),
        enabled: debouncedSearch.trim().length >= 2,
    });

    const toggleFollowMutation = useMutation({
        mutationFn: ({ followingId, isFollowing }: { followingId: string, isFollowing: boolean }) =>
            toggleFollow(user!.id, followingId, isFollowing),
        onMutate: async ({ followingId, isFollowing }) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['community-search', debouncedSearch, user?.id] });

            // Snapshot the previous value
            const previousResults = queryClient.getQueryData<SearchProfile[]>(['community-search', debouncedSearch, user?.id]);

            // Optimistically update to the new value
            if (previousResults) {
                queryClient.setQueryData<SearchProfile[]>(
                    ['community-search', debouncedSearch, user?.id],
                    previousResults.map(p =>
                        p.id === followingId ? { ...p, is_following: !isFollowing } : p
                    )
                );
            }

            return { previousResults };
        },
        onError: (err, newTodo, context) => {
            // Roll back to the previous value if error occurs
            if (context?.previousResults) {
                queryClient.setQueryData(
                    ['community-search', debouncedSearch, user?.id],
                    context.previousResults
                );
            }
        },
        onSettled: () => {
            // Invalidate to make sure data is in sync
            // Commenting out invalidation to avoid immediate re-fetch flicker, let it naturally refresh next time
            // queryClient.invalidateQueries({ queryKey: ['community-search', debouncedSearch, user?.id] });
            // Let's also invalidate feed posts since following has changed
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        }
    });

    const handleToggleFollow = useCallback((profile: SearchProfile) => {
        if (!user) return;
        toggleFollowMutation.mutate({
            followingId: profile.id,
            isFollowing: !!profile.is_following
        });

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }, [user, toggleFollowMutation]);

    return (
        <div className="flex flex-col w-full h-full min-h-[100dvh] bg-slate-950 pb-24">
            {/* Header / Search Bar */}
            <div className="sticky top-0 z-50 p-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors text-slate-300"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Find classmates, groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 p-4">
                {searchTerm.trim().length < 2 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center mt-20 opacity-50">
                        <Search size={48} className="mb-4 text-slate-500" />
                        <h3 className="text-xl font-medium text-white mb-2">Search Network</h3>
                        <p className="text-slate-400 max-w-xs">Type at least 2 characters to discover profiles.</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center mt-10">
                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : isError ? (
                    <div className="text-center text-red-400 mt-10">
                        Something went wrong while searching.
                    </div>
                ) : results && results.length > 0 ? (
                    <div className="space-y-4">
                        {results.map((profile, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={profile.id}
                                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white overflow-hidden shadow-inner">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.full_name || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            (profile.full_name || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-white">{profile.full_name || 'Unknown User'}</span>
                                        <span className="text-sm text-slate-400">MindFlow Member</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleToggleFollow(profile)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                                        profile.is_following
                                            ? "bg-white/10 text-white hover:bg-white/20"
                                            : "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
                                    )}
                                >
                                    {profile.is_following ? (
                                        <>
                                            <UserCheck size={16} />
                                            Following
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={16} />
                                            Follow
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 mt-10">
                        No results found for "{searchTerm}".
                    </div>
                )}
            </div>
        </div>
    );
};
