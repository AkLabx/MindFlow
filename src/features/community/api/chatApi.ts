import { supabase } from '../../../lib/supabase';
import { chatCacheService } from '../services/chatCacheService';

export type ChatRoom = {
  id: string;
  type: 'direct' | 'group';
  created_at: string;
  updated_at: string;
  participants?: {
    user_id: string;
    username?: string | null;
    full_name: string | null;
    avatar_url: string | null;
    last_seen?: string | null;
  }[];
  last_message?: string | null;
  last_message_created_at?: string | null;
  last_message_sender_id?: string | null;
  unread_count?: number;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  text_content: string;
  media_url?: string | null;
  media_type?: string | null;
  voice_duration?: number | null;
  reply_to_id?: string | null;
  reply_to?: {
    id: string;
    sender_id: string;
    sender_name?: string;
    text_content: string;
    media_type?: string | null;
  } | null;
  created_at: string;
  updated_at?: string;
  delivered_at?: string | null;
  read_at?: string | null;
  likes?: { user_id: string }[];
  reactions?: { emoji: string; user_id: string }[];
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
};

export const fetchUserRooms = async (userId: string): Promise<ChatRoom[]> => {
  try {
    // 1. Find rooms user belongs to
    const { data: myParticipants, error: pError } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', userId);

    if (pError) throw pError;
    if (!myParticipants || myParticipants.length === 0) return [];

    const roomIds = myParticipants.map((p) => p.room_id);

    // 2. Fetch rooms with all participants
    const { data: rooms, error: rError } = await supabase
      .from('chat_rooms')
      .select(`
        id, type, created_at, updated_at,
        chat_participants!inner(
          user_id
        )
      `)
      .in('id', roomIds);

    if (rError) throw rError;

    // 3. Fetch profiles for all participants in batch
    const participantUserIds = new Set<string>();
    rooms.forEach((r: any) =>
      r.chat_participants.forEach((p: any) => participantUserIds.add(p.user_id))
    );

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, last_seen')
      .in('id', Array.from(participantUserIds));

    const profileMap = new Map(profiles?.map((p) => [p.id, p]));

    // 4. Fetch latest message snippet for each room
    const { data: latestMessages } = await supabase
      .from('chat_room_messages')
      .select('room_id, text_content, media_type, created_at, sender_id')
      .in('room_id', roomIds)
      .order('created_at', { ascending: false });

    const latestMessageMap = new Map<string, any>();
    if (latestMessages) {
      for (const msg of latestMessages) {
        if (!latestMessageMap.has(msg.room_id)) {
          latestMessageMap.set(msg.room_id, msg);
        }
      }
    }

    const assembledRooms: ChatRoom[] = rooms.map((r: any) => {
      const latestMsg = latestMessageMap.get(r.id);
      let snippet: string | null = null;
      if (latestMsg) {
        if (latestMsg.media_type === 'image') snippet = '📷 Photo';
        else if (latestMsg.media_type === 'voice') snippet = '🎤 Voice message';
        else if (latestMsg.media_type === 'file') snippet = '📄 Document';
        else snippet = latestMsg.text_content || '';
      }

      return {
        id: r.id,
        type: r.type,
        created_at: r.created_at,
        updated_at: r.updated_at,
        last_message: snippet,
        last_message_created_at: latestMsg?.created_at || r.created_at,
        last_message_sender_id: latestMsg?.sender_id || null,
        participants: r.chat_participants.map((p: any) => ({
          user_id: p.user_id,
          ...profileMap.get(p.user_id),
        })),
      };
    });

    // Sort rooms by latest message descending
    assembledRooms.sort((a, b) => {
      const timeA = new Date(a.last_message_created_at || a.created_at).getTime();
      const timeB = new Date(b.last_message_created_at || b.created_at).getTime();
      return timeB - timeA;
    });

    // Save to IndexedDB cache in background
    chatCacheService.saveCachedRooms(assembledRooms).catch(() => {});

    return assembledRooms;
  } catch (err) {
    console.error('Fetch user rooms error:', err);
    // Fallback to local cache if network fails
    return chatCacheService.getCachedRooms();
  }
};

export const uploadChatMedia = async (file: File | Blob, userId: string, customExt?: string): Promise<string> => {
  const fileExt = customExt || (file instanceof File ? file.name.split('.').pop() : 'webp');
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('chat_media')
    .upload(filePath, file, {
      contentType: file.type || 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('chat_media')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const fetchMessages = async (roomId: string, limit = 100): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_room_messages')
      .select('*, likes:chat_message_likes(user_id)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const messages: ChatMessage[] = (data as ChatMessage[])
      .reverse()
      .map((m) => ({
        ...m,
        status: m.read_at ? 'read' : m.delivered_at ? 'delivered' : 'sent',
      }));

    // Cache locally in IndexedDB for 0ms instant retrieval on subsequent visits
    chatCacheService.saveCachedMessages(roomId, messages).catch(() => {});

    return messages;
  } catch (err) {
    console.warn('Network message fetch failed, falling back to local cache:', err);
    return chatCacheService.getCachedMessages(roomId);
  }
};

export const sendMessage = async (message: Partial<ChatMessage>): Promise<ChatMessage> => {
  const insertPayload: any = {
    room_id: message.room_id,
    sender_id: message.sender_id,
    text_content: message.text_content || '',
    media_url: message.media_url,
    media_type: message.media_type,
  };

  if (message.reply_to_id) {
    insertPayload.reply_to_id = message.reply_to_id;
  }
  if (message.voice_duration) {
    insertPayload.voice_duration = message.voice_duration;
  }

  const { data, error } = await supabase
    .from('chat_room_messages')
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;

  const realMsg: ChatMessage = {
    ...(data as ChatMessage),
    reply_to: message.reply_to,
    status: 'sent',
  };

  // Upsert to local cache
  chatCacheService.upsertCachedMessage(realMsg).catch(() => {});

  return realMsg;
};

export const markMessagesAsRead = async (roomId: string, messageIds: string[]): Promise<void> => {
  if (!messageIds || messageIds.length === 0) return;
  try {
    await supabase
      .from('chat_room_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds);
  } catch (e) {
    console.warn('Failed to mark messages as read:', e);
  }
};

export const toggleMessageLike = async (messageId: string, userId: string, isLiked: boolean): Promise<void> => {
  if (isLiked) {
    const { error } = await supabase
      .from('chat_message_likes')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('chat_message_likes')
      .insert({ message_id: messageId, user_id: userId });
    if (error) throw error;
  }
};
