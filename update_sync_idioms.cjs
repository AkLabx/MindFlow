const fs = require('fs');

let content = fs.readFileSync('src/lib/syncService.ts', 'utf8');

// 1. Import IdiomInteraction
content = content.replace('OWSInteraction, AIChatConversation', 'OWSInteraction, IdiomInteraction, AIChatConversation');

// 2. Add pushIdiomInteraction
const pushIdiomInteractionCode = `  /**
   * Pushes an Idiom interaction to Supabase.
   */
  pushIdiomInteraction: async (userId: string, interaction: IdiomInteraction) => {
    const { error } = await supabase.from('user_idiom_interactions').upsert({
      user_id: userId,
      idiom_id: interaction.idiomId,
      is_read: interaction.isRead,
      updated_at: interaction.lastInteractedAt,
    }, { onConflict: 'user_id, idiom_id' });

    if (error) console.error('Error pushing Idiom interaction:', error);
  },
`;
content = content.replace(`removeBookmark: async (userId: string, questionId: string) => {`, pushIdiomInteractionCode + '\n  removeBookmark: async (userId: string, questionId: string) => {');

// 3. Update syncOnLogin
content = content.replace(/\{ data: remoteOWS \}/, `{ data: remoteOWS },\n        { data: remoteIdioms }`);
content = content.replace(/supabase.from\('user_ows_interactions'\).select\('\*'\).eq\('user_id', userId\)/, `supabase.from('user_ows_interactions').select('*').eq('user_id', userId),\n        supabase.from('user_idiom_interactions').select('*').eq('user_id', userId)`);

content = content.replace(/const localOWS = await db.getAllOWSInteractions\(\);/, `const localOWS = await db.getAllOWSInteractions();\n      const localIdioms = await db.getAllIdiomInteractions();`);

content = content.replace(/const remoteOWSIds = new Set\(\(remoteOWS \|\| \[\]\).map\(o => o.word_id\)\);/, `const remoteOWSIds = new Set((remoteOWS || []).map(o => o.word_id));\n        const remoteIdiomIds = new Set((remoteIdioms || []).map(i => i.idiom_id));`);

content = content.replace(/for \(const ows of localOWS\) \{[\s\S]*?\}/, `for (const ows of localOWS) {
          if (!remoteOWSIds.has(ows.wordId)) {
            await syncService.pushOWSInteraction(userId, ows);
          }
        }
        for (const idiom of localIdioms) {
          if (!remoteIdiomIds.has(idiom.idiomId)) {
            await syncService.pushIdiomInteraction(userId, idiom);
          }
        }`);

const hydrateIdiomCode = `
      if (remoteIdioms && remoteIdioms.length > 0) {
        for (const remote of remoteIdioms) {
           await db.saveIdiomInteraction({
              idiomId: remote.idiom_id,
              isRead: remote.is_read,
              lastInteractedAt: remote.updated_at
           });
        }
      }`;
content = content.replace(/if \(remoteOWS && remoteOWS\.length > 0\) \{[\s\S]*?\}\s*\}/, `if (remoteOWS && remoteOWS.length > 0) {
        for (const remote of remoteOWS) {
           await db.saveOWSInteraction({
              wordId: remote.word_id,
              isRead: remote.is_read,
              lastInteractedAt: remote.updated_at
           });
        }
      }\n${hydrateIdiomCode}`);

content = content.replace(/case 'ows_interaction':[\s\S]*?break;/g, `case 'ows_interaction':
            await syncService.pushOWSInteraction(userId, event.payload);
            break;
          case 'idiom_interaction':
            await syncService.pushIdiomInteraction(userId, event.payload);
            break;`);

fs.writeFileSync('src/lib/syncService.ts', content, 'utf8');
