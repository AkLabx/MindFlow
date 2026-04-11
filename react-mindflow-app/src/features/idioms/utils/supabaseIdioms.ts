import { supabase } from '../../../lib/supabase';
import { Idiom, InitialFilters } from '../../../types/models';

export async function fetchIdiomMetadata() {
    let allData: any[] = [];
    let start = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('idiom')
            .select('id, phrase, source_pdf, exam_year, difficulty')
            .range(start, start + limit - 1);

        if (error) {
            console.error("Error fetching Idiom metadata:", error);
            break;
        }

        if (data && data.length > 0) {
            allData = [...allData, ...data];
            start += limit;
            if (data.length < limit) {
                hasMore = false;
            }
        } else {
            hasMore = false;
        }
    }

    // Fetch user interactions for read status
    const { data: userData } = await supabase.auth.getUser();
    let readIds = new Set<string>();

    if (userData?.user) {
        const { data: interactions, error: intError } = await supabase
            .from('user_idiom_interactions')
            .select('idiom_id')
            .eq('user_id', userData.user.id)
            .eq('is_read', true);

        if (!intError && interactions) {
            interactions.forEach(int => readIds.add(String(int.idiom_id)));
        }
    }

    return allData.map(row => ({
        id: String(row.id),
        alphabet: row.phrase ? row.phrase.charAt(0).toUpperCase() : '',
        examName: row.source_pdf || 'Unknown',
        examYear: String(row.exam_year || ''),
        difficulty: row.difficulty || 'Medium',
        readStatus: readIds.has(String(row.id)) ? 'read' : 'unread'
    }));
}

export async function getFilteredIdioms(filters: InitialFilters, selectedLetter: string | null): Promise<Idiom[]> {
    let query = supabase.from('idiom').select('*');

    if (filters.examName.length > 0) {
        query = query.in('source_pdf', filters.examName);
    }
    if (filters.examYear.length > 0) {
        query = query.in('exam_year', filters.examYear.map(Number));
    }
    if (filters.difficulty.length > 0) {
        query = query.in('difficulty', filters.difficulty);
    }
    if (selectedLetter) {
        query = query.ilike('phrase', `${selectedLetter}%`);
    }

    const { data, error } = await query.limit(5000);

    if (error) {
        console.error("Error fetching Idiom data:", error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id || row.v1_id,
        sourceInfo: {
            pdfName: row.source_pdf || 'Unknown',
            examYear: row.exam_year || 0
        },
        properties: {
            difficulty: row.difficulty || 'Medium',
            status: row.status || 'active'
        },
        content: {
            phrase: row.phrase || '',
            meanings: {
                english: row.meaning_english || '',
                hindi: row.meaning_hindi || ''
            },
            usage: row.usage || '',
            extras: {
                mnemonic: row.mnemonic || '',
                origin: ''
            }
        }
    })) as Idiom[];
}
