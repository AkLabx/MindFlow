import { supabase } from '../../../lib/supabase';
import { Idiom, InitialFilters } from '../../../types/models';

export async function getUniqueIdiomFilters() {
    const { data: examNamesData, error: nameError } = await supabase.from('idiom').select('source_pdf').not('source_pdf', 'is', null);
    const { data: examYearsData, error: yearError } = await supabase.from('idiom').select('exam_year').not('exam_year', 'is', null);

    if (nameError) console.error("Error fetching Idiom exam names:", nameError);
    if (yearError) console.error("Error fetching Idiom exam years:", yearError);

    const allExamNames = Array.from(new Set((examNamesData || []).map(r => r.source_pdf))).sort();
    const allExamYears = Array.from(new Set((examYearsData || []).map(r => String(r.exam_year)))).sort();

    return { allExamNames, allExamYears };
}

export async function getIdiomCount(filters: InitialFilters, selectedLetter: string | null): Promise<number> {
    let query = supabase.from('idiom').select('id', { count: 'exact', head: true });

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

    const { count, error } = await query;
    if (error) {
        console.error("Error fetching Idiom count:", error);
        return 0;
    }
    return count || 0;
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


export async function fetchIdiomMetadata() {
    // Fetch only the properties needed for filtering
    const { data, error } = await supabase.from('idiom').select('id, phrase, source_pdf, exam_year, difficulty');
    if (error) {
        console.error("Error fetching Idiom metadata:", error);
        return [];
    }
    return (data || []).map(row => ({
        id: row.id,
        alphabet: row.phrase ? row.phrase.charAt(0).toUpperCase() : '',
        examName: row.source_pdf || 'Unknown',
        examYear: String(row.exam_year || ''),
        difficulty: row.difficulty || 'Medium'
    }));
}
