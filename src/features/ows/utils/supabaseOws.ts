import { supabase } from '../../../lib/supabase';
import { OneWord, InitialFilters } from '../../../types/models';

export async function getUniqueOwsFilters() {
    const { data: examNamesData, error: nameError } = await supabase.from('ows').select('source_pdf').not('source_pdf', 'is', null);
    const { data: examYearsData, error: yearError } = await supabase.from('ows').select('exam_year').not('exam_year', 'is', null);

    if (nameError) console.error("Error fetching OWS exam names:", nameError);
    if (yearError) console.error("Error fetching OWS exam years:", yearError);

    const allExamNames = Array.from(new Set((examNamesData || []).map(r => r.source_pdf))).sort();
    const allExamYears = Array.from(new Set((examYearsData || []).map(r => String(r.exam_year)))).sort();

    return { allExamNames, allExamYears };
}

export async function getOwsCount(filters: InitialFilters, selectedLetter: string | null): Promise<number> {
    let query = supabase.from('ows').select('id', { count: 'exact', head: true });

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

    const { count, error } = await query;
    if (error) {
        console.error("Error fetching OWS count:", error);
        return 0;
    }
    return count || 0;
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
            id: row.id ? parseInt(row.id.replace(/[^0-9]/g, '')) || 0 : 0, // Fallback ID if needed
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


export async function fetchOwsMetadata() {
    // Fetch only the properties needed for filtering
    const { data, error } = await supabase.from('ows').select('id, word, source_pdf, exam_year, difficulty');
    if (error) {
        console.error("Error fetching OWS metadata:", error);
        return [];
    }
    return (data || []).map(row => ({
        id: row.id,
        alphabet: row.word ? row.word.charAt(0).toUpperCase() : '',
        examName: row.source_pdf || 'Unknown',
        examYear: String(row.exam_year || ''),
        difficulty: row.difficulty || 'Medium'
    }));
}
