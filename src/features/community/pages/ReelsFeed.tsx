import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPosts, Post } from '../api/communityApi';
import { useAuth } from '../../auth/context/AuthContext';
import { Heart, MessageCircle, Share2, MoreVertical, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils/cn';

export const ReelsFeed: React.FC = () => {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts-reels'],
    queryFn: () => fetchPosts(),
  });

  // Filter out to only reels/videos for demo purposes
  // Since we only seeded text, we'll map them for testing the layout if no media exists
  const reelPosts = posts?.filter(p => p.type === 'reel' || p.type === 'video' || p.media_url || p.type === 'text') || [];

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Loading Reels...</div>;
  }

  return (
    <div className="h-[100dvh] w-full bg-black overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative z-50">
      {/* Absolute Back Button */}
      <div className="absolute top-safe left-4 z-50 mt-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10">
          <ArrowLeft size={24} />
        </button>
      </div>

      {reelPosts.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center text-slate-500">No reels available</div>
      ) : (
        reelPosts.map((post) => (
          <ReelItem key={post.id} post={post} />
        ))
      )}
    </div>
  );
};

const ReelItem: React.FC<{ post: Post }> = ({ post }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          // Here we would play/pause a video element based on entry.isIntersecting
        });
      },
      { threshold: 0.6 } // trigger when 60% of the reel is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-full snap-start relative bg-slate-900 overflow-hidden flex items-center justify-center"
    >
      {/* Background Media (Simulated Video/Image) */}
      {post.media_url ? (
         <img src={post.media_url} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Reel media" />
      ) : (
         <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-indigo-900 to-black flex items-center justify-center p-8 text-center text-2xl font-bold text-white/50 leading-relaxed">
            {post.content}
         </div>
      )}

      {/* Overlay Gradient for Text Readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Side Action Bar */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10">
        <button className="flex flex-col items-center gap-1 group">
          <div className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 group-active:scale-90 transition-transform">
            <Heart size={28} className={cn(post.is_liked_by_me && "fill-red-500 text-red-500")} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{post.likes_count || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group">
          <div className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 group-active:scale-90 transition-transform">
            <MessageCircle size={28} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{post.comments_count || 0}</span>
        </button>

        <button className="flex flex-col items-center gap-1 group">
          <div className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 group-active:scale-90 transition-transform">
            <Share2 size={28} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </button>
      </div>

      {/* Bottom Content Area */}
      <div className="absolute bottom-0 left-0 right-16 p-4 z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 border border-white/20 overflow-hidden">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500" />
            )}
          </div>
          <span className="text-white font-semibold drop-shadow-md">{post.profiles?.full_name || 'MindFlow User'}</span>
          <button className="px-3 py-1 rounded-full border border-white/50 text-white text-xs font-semibold backdrop-blur-sm bg-white/10">
            Follow
          </button>
        </div>

        {post.media_url && (
          <p className="text-white text-sm line-clamp-2 drop-shadow-md mb-2">
            {post.content}
          </p>
        )}
      </div>

      {/* Playing indicator */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-safe right-4 mt-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded border border-red-400 shadow-lg"
          >
            LIVE
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
