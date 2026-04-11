with open("src/features/ows/utils/supabaseOws.ts", "r") as f:
    content = f.read()

# Add spatial statuses into metadata fetch
metadata_logic = """
    // Fetch user interactions for read status and spatial engine
    const { data: userData } = await supabase.auth.getUser();
    let userInteractions: Record<string, any> = {};

    if (userData?.user) {
        const { data: interactions, error: intError } = await supabase
            .from('user_ows_interactions')
            .select('word_id, is_read, status, next_review_at')
            .eq('user_id', userData.user.id);

        if (!intError && interactions) {
            interactions.forEach(int => {
                 userInteractions[String(int.word_id)] = int;
            });
        }
    }

    return allData.map(row => {
        const rowId = row.word || String(row.id); // Using word as fallback word_id
        const interaction = userInteractions[rowId];
        return {
            id: rowId, // Return word_id for spatial mapping
            alphabet: row.word ? row.word.charAt(0).toUpperCase() : '',
            examName: row.source_pdf || 'Unknown',
            examYear: String(row.exam_year || ''),
            difficulty: row.difficulty || 'Medium',
            readStatus: interaction?.is_read ? 'read' : 'unread',
            status: interaction?.status,
            next_review_at: interaction?.next_review_at
        };
    });
}
"""

import re
content = re.sub(r'// Fetch user interactions[\s\S]*?\}\)', metadata_logic, content)

# Inject deck filtering logic
deck_filter_logic = """
    let parsedData = (data || []).map(row => ({
        id: row.word, // Use word as spatial ID
        sourceInfo: {
            pdfName: row.source_pdf || 'Unknown',
            examYear: row.exam_year || 0
        },
        properties: {
            difficulty: row.difficulty || 'Medium',
            status: row.status || 'active'
        },
        content: {
            id: row.id ? parseInt(row.id.replace(/[^0-9]/g, '')) || 0 : 0,
            pos: row.pos || '',
            word: row.word || '',
            meaning_en: row.meaning_english || '',
            meaning_hi: row.meaning_hindi || '',
            usage_sentences: typeof row.usage_sentences === 'string' ? JSON.parse(row.usage_sentences) : (row.usage_sentences || []),
            note: '',
            origin: ''
        }
    })) as OneWord[];

    // THE SIEVE (Deck Mode Filter)
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user && filters.deckMode && filters.deckMode.length > 0) {
        const { data: interactions } = await supabase
            .from('user_ows_interactions')
            .select('word_id, status, next_review_at')
            .eq('user_id', userData.user.id);

        const interactMap = new Map();
        if (interactions) interactions.forEach(i => interactMap.set(i.word_id, i));

        const mode = filters.deckMode[0];
        const now = new Date().getTime();

        parsedData = parsedData.filter(card => {
             const userState = interactMap.get(card.id);

             // Strip out mastered cards permanently
             if (userState?.status === 'mastered') return false;

             if (mode === 'All Unseen') {
                 return !userState; // Only cards never interacted with
             } else if (mode === 'Due for Review') {
                 if (!userState || !userState.next_review_at) return false;
                 return new Date(userState.next_review_at).getTime() <= now;
             } else if (mode === 'Mix') {
                 // Unseen OR Due
                 if (!userState) return true;
                 if (userState.next_review_at && new Date(userState.next_review_at).getTime() <= now) return true;
                 return false;
             }
             return true;
        });

        // Sort mix: Put "due" ones before "unseen" ones, or randomize
        if (mode === 'Mix') {
             parsedData.sort((a, b) => {
                 const aDue = interactMap.has(a.id) ? 1 : 0;
                 const bDue = interactMap.has(b.id) ? 1 : 0;
                 return bDue - aDue; // Due ones first
             });
        }
    }

    return parsedData;
}
"""

content = re.sub(r'    return \(data \|\| \[\]\)[\s\S]*?\}', deck_filter_logic, content)

with open("src/features/ows/utils/supabaseOws.ts", "w") as f:
    f.write(content)
