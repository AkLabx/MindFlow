import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  Languages,
  BookOpen,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Upload
} from 'lucide-react';
import { UniversalContentImporter } from '../../components/UniversalContentImporter';

export const AdminVocabPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'ows' | 'idiom' | 'synonym') || 'ows';
  const [activeTab, setActiveTab] = useState<'ows' | 'idiom' | 'synonym'>(initialTab);
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState({ ows: 0, idiom: 0, synonym: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporterOpen, setIsImporterOpen] = useState(searchParams.get('action') === 'import');

  const fetchVocabCounts = async () => {
    try {
      const [
        { count: owsC },
        { count: idmC },
        { count: synC }
      ] = await Promise.all([
        supabase.from('ows').select('id', { count: 'exact', head: true }),
        supabase.from('idiom').select('id', { count: 'exact', head: true }),
        supabase.from('synonym').select('id', { count: 'exact', head: true })
      ]);
      setCounts({ ows: owsC || 0, idiom: idmC || 0, synonym: synC || 0 });
    } catch (e) {
      console.error('Error fetching vocab counts:', e);
    }
  };

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const tableName = activeTab === 'ows' ? 'ows' : activeTab === 'idiom' ? 'idiom' : 'synonym';
      let query = supabase.from(tableName).select('*').limit(30);

      if (search.trim()) {
        const field = activeTab === 'idiom' ? 'phrase' : 'word';
        query = query.ilike(field, `%${search.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching vocab items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabCounts();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            Vocabulary Matrix Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consolidated repository for One Word Substitutions, Idioms & Phrases, and Synonyms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Universal Importer</span>
          </button>

          {activeTab === 'ows' && (
            <button
              onClick={() => navigate('/admin/upload-ows')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Upload OWS</span>
            </button>
          )}
          {activeTab === 'idiom' && (
            <button
              onClick={() => navigate('/admin/upload-idioms')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Upload Idiom</span>
            </button>
          )}
          {activeTab === 'synonym' && (
            <button
              onClick={() => navigate('/admin/upload-synonyms')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Upload Synonym</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => { setActiveTab('ows'); setSearch(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ows'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>One Word Substitutions</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
            {counts.ows.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('idiom'); setSearch(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'idiom'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Idioms & Phrases</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
            {counts.idiom.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('synonym'); setSearch(''); }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'synonym'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Synonyms & Antonyms</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
            {counts.synonym.toLocaleString()}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab.toUpperCase()} items...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>
        <button
          onClick={fetchItems}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Vocabulary Data Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Word / Phrase</th>
                <th className="py-3.5 px-4">Primary Meaning</th>
                <th className="py-3.5 px-4">Hindi Translation</th>
                <th className="py-3.5 px-4">Exam / Source</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      Loading vocabulary items...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No vocabulary items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {item.word || item.phrase}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="line-clamp-2 text-slate-700 dark:text-slate-300">
                        {item.meaning_english || item.meaning || item.definition || '—'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {item.meaning_hindi || item.hindi || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                        {item.source_pdf || item.exam_year || 'PYQ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          if (activeTab === 'ows') navigate('/admin/upload-ows');
                          else if (activeTab === 'idiom') navigate('/admin/upload-idioms');
                          else navigate('/admin/upload-synonyms');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Universal Content Importer Modal */}
      <UniversalContentImporter
        initialType={activeTab}
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={() => {
          fetchVocabCounts();
          fetchItems();
        }}
      />
    </div>
  );
};

export default AdminVocabPage;
