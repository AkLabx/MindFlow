import { performance } from 'perf_hooks';
import { supabase } from './src/lib/supabase.js';

// Mock Supabase to simulate network latency
let callCount = 0;
const mockUpsert = async () => {
  callCount++;
  return new Promise(resolve => setTimeout(() => resolve({ error: null }), 50)); // 50ms latency
};

const mockSupabase = {
  from: () => ({
    upsert: mockUpsert
  })
};

// Mock data
const localConvs = Array.from({ length: 5 }, (_, i) => ({
  id: `conv-${i}`,
  title: `Conversation ${i}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

const getChatMessages = async (convId) => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `msg-${convId}-${i}`,
    conversation_id: convId,
    role: 'user',
    content: `Message ${i}`,
    created_at: new Date().toISOString(),
  }));
};

// N+1 implementation
const pushConvSingle = async (userId, conv) => {
  await mockSupabase.from('ai_chat_conversations').upsert([conv]);
};

const pushMsgSingle = async (msg) => {
  await mockSupabase.from('ai_chat_messages').upsert([msg]);
};

const syncNPlusOne = async () => {
  for (const conv of localConvs) {
    await pushConvSingle('user1', conv);
    const msgs = await getChatMessages(conv.id);
    for (const msg of msgs) {
      await pushMsgSingle(msg);
    }
  }
};

// Batch implementation
const pushConvsBatch = async (userId, convs) => {
  await mockSupabase.from('ai_chat_conversations').upsert(convs);
};
const pushMsgsBatch = async (msgs) => {
  await mockSupabase.from('ai_chat_messages').upsert(msgs);
};

const syncBatch = async () => {
  const allMsgs = [];
  for (const conv of localConvs) {
    const msgs = await getChatMessages(conv.id);
    allMsgs.push(...msgs);
  }
  await pushConvsBatch('user1', localConvs);
  await pushMsgsBatch(allMsgs);
};

const run = async () => {
  console.log('Running N+1...');
  callCount = 0;
  const start1 = performance.now();
  await syncNPlusOne();
  const end1 = performance.now();
  console.log(`N+1 took ${end1 - start1} ms, API calls: ${callCount}`);

  console.log('Running Batch...');
  callCount = 0;
  const start2 = performance.now();
  await syncBatch();
  const end2 = performance.now();
  console.log(`Batch took ${end2 - start2} ms, API calls: ${callCount}`);
};

run();
