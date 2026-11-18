import { ChatRoom, ChatMessage } from '../api/chatApi';

const DB_NAME = 'MindFlowCommunityChatDB';
const DB_VERSION = 1;
const ROOMS_STORE = 'rooms';
const MESSAGES_STORE = 'messages';
const SYNC_META_STORE = 'sync_meta';

class ChatCacheService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB is not available in this environment'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(ROOMS_STORE)) {
          db.createObjectStore(ROOMS_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const msgStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
          msgStore.createIndex('room_id', 'room_id', { unique: false });
          msgStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(SYNC_META_STORE)) {
          db.createObjectStore(SYNC_META_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Rooms Cache ---

  async getCachedRooms(): Promise<ChatRoom[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(ROOMS_STORE, 'readonly');
        const store = tx.objectStore(ROOMS_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async saveCachedRooms(rooms: ChatRoom[]): Promise<void> {
    try {
      if (!rooms || rooms.length === 0) return;
      const db = await this.getDB();
      const tx = db.transaction(ROOMS_STORE, 'readwrite');
      const store = tx.objectStore(ROOMS_STORE);
      for (const room of rooms) {
        store.put(room);
      }
    } catch (e) {
      console.warn('[ChatCache] Failed to save rooms cache:', e);
    }
  }

  // --- Messages Cache ---

  async getCachedMessages(roomId: string): Promise<ChatMessage[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(MESSAGES_STORE, 'readonly');
        const store = tx.objectStore(MESSAGES_STORE);
        const index = store.index('room_id');
        const req = index.getAll(IDBKeyRange.only(roomId));

        req.onsuccess = () => {
          const msgs: ChatMessage[] = req.result || [];
          // Sort chronologically (oldest at top, newest at bottom)
          msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          resolve(msgs);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async saveCachedMessages(roomId: string, messages: ChatMessage[]): Promise<void> {
    try {
      if (!messages || messages.length === 0) return;
      const db = await this.getDB();
      const tx = db.transaction(MESSAGES_STORE, 'readwrite');
      const store = tx.objectStore(MESSAGES_STORE);
      for (const msg of messages) {
        store.put({ ...msg, room_id: roomId });
      }
    } catch (e) {
      console.warn('[ChatCache] Failed to save messages cache:', e);
    }
  }

  async upsertCachedMessage(message: ChatMessage): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(MESSAGES_STORE, 'readwrite');
      const store = tx.objectStore(MESSAGES_STORE);
      store.put(message);
    } catch (e) {
      console.warn('[ChatCache] Failed to upsert message:', e);
    }
  }

  async deleteCachedMessage(messageId: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(MESSAGES_STORE, 'readwrite');
      const store = tx.objectStore(MESSAGES_STORE);
      store.delete(messageId);
    } catch (e) {
      console.warn('[ChatCache] Failed to delete cached message:', e);
    }
  }

  async updateMessageStatus(messageId: string, status: ChatMessage['status']): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(MESSAGES_STORE, 'readwrite');
      const store = tx.objectStore(MESSAGES_STORE);
      const getReq = store.get(messageId);
      getReq.onsuccess = () => {
        const msg = getReq.result;
        if (msg) {
          msg.status = status;
          store.put(msg);
        }
      };
    } catch (e) {
      console.warn('[ChatCache] Failed to update message status:', e);
    }
  }
}

export const chatCacheService = new ChatCacheService();
