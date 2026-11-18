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
  file_name?: string | null;
  file_size?: number | null;
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
  deleted_at?: string | null;
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
      .select('room_id, text_content, media_type, file_name, created_at, sender_id, deleted_at')
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
        if (latestMsg.deleted_at) {
          snippet = '🚫 Message was deleted';
        } else if (latestMsg.media_type === 'image') {
          snippet = '📷 Photo';
        } else if (latestMsg.media_type === 'voice') {
          snippet = '🎤 Voice note';
        } else if (latestMsg.media_type === 'file') {
          snippet = `📄 ${latestMsg.file_name || 'Document'}`;
        } else {
          snippet = latestMsg.text_content || '';
        }
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

export const fetchRoomById = async (roomId: string): Promise<ChatRoom | null> => {
  try {
    const { data: room, error: rError } = await supabase
      .from('chat_rooms')
      .select(`
        id, type, created_at, updated_at,
        chat_participants(
          user_id
        )
      `)
      .eq('id', roomId)
      .maybeSingle();

    if (rError || !room) return null;

    const participantUserIds = (room.chat_participants || []).map((p: any) => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, last_seen')
      .in('id', participantUserIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return {
      id: room.id,
      type: room.type,
      created_at: room.created_at,
      updated_at: room.updated_at,
      participants: (room.chat_participants || []).map((p: any) => ({
        user_id: p.user_id,
        ...profileMap.get(p.user_id),
      })),
    };
  } catch (err) {
    console.error('Fetch room by id error:', err);
    return null;
  }
};

export const uploadChatMedia = async (file: File | Blob, userId: string, customExt?: string): Promise<string> => {
  const fileExt = customExt || (file instanceof File ? file.name.split('.').pop() : 'webp');
  // Use crypto.randomUUID for unguessable and secure filenames
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const filePath = `${userId}/${uniqueId}.${fileExt}`;

  let detectedContentType = file.type;
  if (!detectedContentType) {
    if (fileExt === 'webp') detectedContentType = 'image/webp';
    else if (fileExt === 'webm') detectedContentType = 'audio/webm';
    else if (fileExt === 'pdf') detectedContentType = 'application/pdf';
    else detectedContentType = 'application/octet-stream';
  }

  const { error: uploadError } = await supabase.storage
    .from('chat_media')
    .upload(filePath, file, {
      contentType: detectedContentType,
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
      .select('*, reactions:chat_message_reactions(emoji, user_id)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch reply_to references in batch if present
    const replyIds = (data || []).map((m: any) => m.reply_to_id).filter(Boolean);
    let replyMap = new Map<string, any>();
    if (replyIds.length > 0) {
      const { data: replyRows } = await supabase
        .from('chat_room_messages')
        .select('id, sender_id, text_content, media_type')
        .in('id', replyIds);
      if (replyRows) {
        replyMap = new Map(replyRows.map((r: any) => [r.id, r]));
      }
    }

    const messages: ChatMessage[] = (data as ChatMessage[])
      .reverse()
      .map((m: any) => {
        let replyObj = null;
        if (m.reply_to_id && replyMap.has(m.reply_to_id)) {
          const rawReply = replyMap.get(m.reply_to_id);
          replyObj = {
            id: rawReply.id,
            sender_id: rawReply.sender_id,
            text_content: rawReply.text_content,
            media_type: rawReply.media_type,
          };
        }

        return {
          ...m,
          reply_to: replyObj || m.reply_to,
          status: m.read_at ? 'read' : m.delivered_at ? 'delivered' : 'sent',
        };
      });

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
  if (message.file_name) {
    insertPayload.file_name = message.file_name;
  }
  if (message.file_size) {
    insertPayload.file_size = message.file_size;
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

export const toggleMessageReaction = async (
  messageId: string,
  userId: string,
  emoji: string
): Promise<{ added: boolean; emoji: string }> => {
  // Check if existing reaction exists
  const { data: existing } = await supabase
    .from('chat_message_reactions')
    .select('id, emoji')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.emoji === emoji) {
      // Remove reaction
      await supabase
        .from('chat_message_reactions')
        .delete()
        .eq('id', existing.id);
      return { added: false, emoji };
    } else {
      // Update reaction to new emoji
      await supabase
        .from('chat_message_reactions')
        .update({ emoji })
        .eq('id', existing.id);
      return { added: true, emoji };
    }
  }

  // Insert new reaction
  const { error } = await supabase
    .from('chat_message_reactions')
    .insert({ message_id: messageId, user_id: userId, emoji });

  if (error) throw error;
  return { added: true, emoji };
};

export const deleteChatMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_room_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) throw error;
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
