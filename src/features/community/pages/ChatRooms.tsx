import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserRooms, fetchMessages, sendMessage, uploadChatMedia, ChatRoom, ChatMessage } from '../api/chatApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useSocialRealtime } from '../hooks/useSocialRealtime';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { supabase } from '../../../lib/supabase';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, File, ArrowLeft } from 'lucide-react';
import { cn } from '../../../utils/cn';

export const ChatRooms: React.FC = () => {
  const { user } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['chat-rooms', user?.id],
    queryFn: () => fetchUserRooms(user!.id),
    enabled: !!user,
  });

  if (isLoading) return <div className="text-white p-4">Loading chats...</div>;

  if (activeRoomId) {
    const room = rooms?.find(r => r.id === activeRoomId);
    return <ActiveChatRoom room={room!} onBack={() => setActiveRoomId(null)} />;
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-32 px-4">
      <h2 className="text-2xl font-bold text-white mb-6 mt-4">Messages</h2>
      <div className="space-y-2">
        {rooms?.map(room => {
          // For direct chats, find the other person
          const otherParticipant = room.participants?.find(p => p.user_id !== user?.id);
          const title = room.type === 'direct' ? otherParticipant?.full_name || 'Unknown User' : 'Group Chat';
          const avatar = room.type === 'direct' ? otherParticipant?.avatar_url : null;

          return (
            <motion.button
              key={room.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveRoomId(room.id)}
              className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-2xl p-4 flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-200 truncate">{title}</div>
                <div className="text-sm text-slate-500 truncate">Tap to open chat</div>
              </div>
            </motion.button>
          );
        })}
        {rooms?.length === 0 && (
          <div className="text-slate-500 text-center mt-10">No messages yet.</div>
        )}
      </div>
    </div>
  );
};

const ActiveChatRoom: React.FC<{ room: ChatRoom; onBack: () => void }> = ({ room, onBack }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { sendTypingStatus } = useSocialRealtime();
  
  const [newMessage, setNewMessage] = useState('');
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['chat-messages', room.id],
    queryFn: () => fetchMessages(room.id),
  });

  // Realtime subscription for incoming messages
  useEffect(() => {
    const channel = supabase.channel(`room:${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_room_messages', filter: `room_id=eq.${room.id}` }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        
        // If we sent it, we already optimistic updated. We might need to reconcile id, but standard cache invalidation works.
        if (newMsg.sender_id !== user?.id) {
            queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
                if (!old) return [newMsg];
                // avoid dupes
                if (old.find(m => m.id === newMsg.id)) return old;
                return [...old, { ...newMsg, status: 'sent' }];
            });
            // Smart auto-scroll for incoming: we could check if user is at bottom before scrolling
            // but for simplicity here we just scroll to bottom when new msg arrives
            setTimeout(() => {
               virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'smooth' });
            }, 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id, queryClient, user]);

  const sendMutation = useMutation({
    mutationFn: (msg: Partial<ChatMessage>) => sendMessage(msg),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', room.id] });
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(['chat-messages', room.id]);
      
      const optimisticMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        room_id: room.id,
        sender_id: user!.id,
        text_content: newMsg.text_content || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'sending'
      };

      queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
        return old ? [...old, optimisticMsg] : [optimisticMsg];
      });

      // Instantly scroll to bottom for our own optimistic message
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'smooth' });
      }, 50);

      return { previousMessages, tempId: optimisticMsg.id };
    },
    onSuccess: (realMsg, variables, context) => {
       queryClient.setQueryData<ChatMessage[]>(['chat-messages', room.id], (old) => {
         if (!old) return [realMsg];
         return old.map(m => m.id === context?.tempId ? { ...realMsg, status: 'sent' } : m);
       });
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', room.id], context.previousMessages);
      }
    }
  });

  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      
      // Step A: Upload raw file to bucket
      const publicUrl = await uploadChatMedia(file, user.id);
      
      // Step B & C: Optimistic UI & Postgres Insert handled by sendMutation
      sendMutation.mutate({
        room_id: room.id,
        sender_id: user.id,
        text_content: type === 'image' ? 'Sent an image' : 'Sent a file',
        media_url: publicUrl,
        media_type: type
      });
      
    } catch (error) {
      console.error("Failed to upload media:", error);
      // Fallback: Notify user of failure (could use toast here)
      alert("Failed to upload media. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    sendMutation.mutate({
      room_id: room.id,
      sender_id: user.id,
      text_content: newMessage.trim()
    });
    setNewMessage('');
    sendTypingStatus(room.id, false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    // Debounce this in a real scenario
    sendTypingStatus(room.id, e.target.value.length > 0);
  };

  const otherParticipant = room.participants?.find(p => p.user_id !== user?.id);
  const title = room.type === 'direct' ? otherParticipant?.full_name || 'Unknown User' : 'Group Chat';

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-2xl mx-auto bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-500 overflow-hidden">
             {otherParticipant?.avatar_url && <img src={otherParticipant.avatar_url} className="w-full h-full object-cover" />}
        </div>
        <div className="font-semibold text-white">{title}</div>
      </div>

      {/* Messages Area (Virtualized) */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-10 text-slate-400">Loading messages...</div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages || []}
            initialTopMostItemIndex={(messages?.length || 0) - 1}
            itemContent={(index, msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div className={cn("px-4 py-2 flex", isMine ? "justify-end" : "justify-start")}>
                                    <div 
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2",
                      isMine 
                        ? "bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-600/20"
                        : "bg-white/10 backdrop-blur-md text-white rounded-bl-sm border border-white/5 shadow-sm",
                      msg.status === 'sending' && "opacity-60"
                    )}
                  >
                    {msg.media_url && msg.media_type === 'image' && (
                       <div className="mb-2 rounded-xl overflow-hidden bg-black/20">
                          <img src={msg.media_url} alt="chat media" className="max-w-full h-auto object-cover max-h-64" loading="lazy" />
                       </div>
                    )}
                    {msg.media_url && msg.media_type === 'file' && (
                       <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-black/20 rounded-xl mb-2 hover:bg-black/30 transition">
                          <File size={24} className="text-white" />
                          <span className="text-sm font-medium underline">Attachment (Click to view)</span>
                       </a>
                    )}
                    <div className="whitespace-pre-wrap break-words">{msg.text_content}</div>
                    <div className={cn("text-[10px] mt-1 text-right", isMine ? "text-indigo-200" : "text-slate-400")}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.status === 'sending' && " • sending..."}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)] relative">
        {isUploading && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-indigo-400 animate-pulse bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Uploading media...
          </div>
        )}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 pl-4 pr-1">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Message..."
            className="flex-1 bg-transparent border-none text-white focus:ring-0 outline-none placeholder:text-slate-500"
          />
          <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
          <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
          
          <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white rounded-full">
            <ImageIcon size={20} />
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white rounded-full">
            <File size={20} />
          </button>
          <button 
            type="submit" 
            disabled={(!newMessage.trim() && !isUploading)}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:bg-slate-700 transition-colors"
          >
            <Send size={18} className="translate-x-[1px] -translate-y-[1px]" />
          </button>
        </div>
      </form>
    </div>
  );
};
