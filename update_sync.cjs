const fs = require('fs');

let content = fs.readFileSync('src/lib/syncService.ts', 'utf8');

// 1. Import OWSInteraction
content = content.replace('SynonymInteraction }', 'SynonymInteraction, OWSInteraction }');

// 2. Add pushOWSInteraction
const pushOWSInteractionCode = `  /**
   * Pushes an OWS interaction to Supabase.
   */
  pushOWSInteraction: async (userId: string, interaction: OWSInteraction) => {
    const { error } = await supabase.from('user_ows_interactions').upsert({
      user_id: userId,
      word_id: interaction.wordId,
      is_read: interaction.isRead,
      updated_at: interaction.lastInteractedAt,
    }, { onConflict: 'user_id, word_id' });

    if (error) console.error('Error pushing OWS interaction:', error);
  },
`;
content = content.replace(`removeBookmark: async (userId: string, questionId: string) => {`, pushOWSInteractionCode + '\n  removeBookmark: async (userId: string, questionId: string) => {');

// 3. Update pullUserData
content = content.replace(/const \{ data: remoteSynonyms, error: synonymsError \} = await supabase/g, `const { data: remoteOWS, error: owsError } = await supabase
        .from('user_ows_interactions')
        .select('*')
        .eq('user_id', userId);

      if (owsError) console.error('Error fetching remote OWS:', owsError);

      const { data: remoteSynonyms, error: synonymsError } = await supabase`);

content = content.replace(/const localSynonyms = await db\.getAllSynonymInteractions\(\);/g, `const localSynonyms = await db.getAllSynonymInteractions();
      const localOWS = await db.getAllOWSInteractions();`);

content = content.replace(/const remoteSynonymIds = new Set\(remoteSynonyms\?.map\(s => s\.word_id\) \|\| \[\]\);/g, `const remoteSynonymIds = new Set(remoteSynonyms?.map(s => s.word_id) || []);
      const remoteOWSIds = new Set(remoteOWS?.map(o => o.word_id) || []);`);

content = content.replace(/if \(remoteSynonyms && remoteSynonyms\.length > 0\) \{[\s\S]*?\}/g, `if (remoteSynonyms && remoteSynonyms.length > 0) {
        for (const remote of remoteSynonyms) {
           await db.saveSynonymInteraction({
              wordId: remote.word_id,
              wordString: remote.word_id, // Fallback
              masteryLevel: remote.mastery_level as any,
              dailyChallengeScore: remote.daily_challenge_score,
              gamificationScore: remote.gamification_score,
              viewedExplanation: remote.viewed_explanation,
              viewedWordFamily: remote.viewed_word_family,
              lastInteractedAt: remote.last_interacted_at
           });
        }
      }

      if (remoteOWS && remoteOWS.length > 0) {
        for (const remote of remoteOWS) {
           await db.saveOWSInteraction({
              wordId: remote.word_id,
              isRead: remote.is_read,
              lastInteractedAt: remote.updated_at
           });
        }
      }`);

content = content.replace(/for \(const syn of localSynonyms\) \{[\s\S]*?\}/g, `for (const syn of localSynonyms) {
          if (!remoteSynonymIds.has(syn.wordId)) {
            await syncService.pushSynonymInteraction(userId, syn);
          }
        }
        for (const ows of localOWS) {
          if (!remoteOWSIds.has(ows.wordId)) {
            await syncService.pushOWSInteraction(userId, ows);
          }
        }`);

content = content.replace(/case 'synonym_interaction':[\s\S]*?break;/g, `case 'synonym_interaction':
            await syncService.pushSynonymInteraction(userId, event.payload);
            break;
          case 'ows_interaction':
            await syncService.pushOWSInteraction(userId, event.payload);
            break;`);


fs.writeFileSync('src/lib/syncService.ts', content, 'utf8');
