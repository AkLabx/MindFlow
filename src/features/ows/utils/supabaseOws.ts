import { supabase } from '../../../lib/supabase';
import { OneWord, InitialFilters } from '../../../types/models';

export async function fetchOwsMetadata() {
    let allData: any[] = [];
    let start = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('ows')
            .select('id, word, source_pdf, exam_year, difficulty')
            .range(start, start + limit - 1);

        if (error) {
            console.error("Error fetching OWS metadata:", error);
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
            .from('user_ows_interactions')
            .select('ows_id')
            .eq('user_id', userData.user.id)
            .eq('is_read', true);

        if (!intError && interactions) {
            interactions.forEach(int => readIds.add(String(int.ows_id)));
        }
    }

    return allData.map(row => ({
        id: String(row.id),
        alphabet: row.word ? row.word.charAt(0).toUpperCase() : '',
        examName: row.source_pdf || 'Unknown',
        examYear: String(row.exam_year || ''),
        difficulty: row.difficulty || 'Medium',
        readStatus: readIds.has(String(row.id)) ? 'read' : 'unread'
    }));
}

export async function getFilteredOws(filters: InitialFilters, selectedLetter: string | null): Promise<OneWord[]> {
    let query = supabase.from('ows').select('*');

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
        query = query.ilike('word', `${selectedLetter}%`);
    }

    // Limit to 5000 just in case to prevent massive memory spikes if unfiltered
    const { data, error } = await query.limit(5000);

    if (error) {
        console.error("Error fetching OWS data:", error);
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
}
