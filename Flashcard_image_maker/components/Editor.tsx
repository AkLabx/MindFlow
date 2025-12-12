
import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import { Upload, FileJson, ClipboardPaste, X, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Image as ImageIcon, RectangleHorizontal, RectangleVertical, Package, Loader2 } from 'lucide-react';
// @ts-ignore
import JSZip from 'jszip';
import { EditorProps, FlashcardData, CardTemplate, Orientation } from '../types';
import { drawCard } from '../utils/canvasDrawing';

// Helper to chunk array
const chunkArray = <T,>(array: T[], size: number): T[][] => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

// Helper to map incoming JSON (User format or Standard format) to FlashcardData
const mapRawItemsToFlashcards = (rawItems: any[]): FlashcardData[] => {
  return rawItems.map((item: any, index: number) => {
    const hasNestedContent = item && typeof item === 'object' && 'content' in item;
    const source = hasNestedContent ? item.content : item;

    if (!source) return {
       id: String(index + 1),
       template: 'idiom', idiom: "", meaningEng: "", meaningHindi: "", usage: "", etymology: "", mnemonic: "", image: "", orientation: 'landscape'
    };

    // Try to find ID from source, or item, or fallback to index
    const id = source.id || item.id || source.Id || String(index + 1);

    let template: CardTemplate = item.template || source.template;
    if (!template) {
       if (source.word && source.pos) {
          template = 'ows';
       } else {
          template = 'idiom';
       }
    }

    const idiom = source.word || source.Word || source.phrase || source.Phrase || source.idiom || source.Idiom || "";
    const partOfSpeech = source.pos || source.Pos || "";
    
    const meaningsObj = source.meanings || source.Meanings || source;
    const meaningEng = source.meaning_en || meaningsObj.english || meaningsObj.English || source.meaningEng || "";
    const meaningHindi = source.meaning_hi || meaningsObj.hindi || meaningsObj.Hindi || source.meaningHindi || "";
    
    let usage = "";
    if (Array.isArray(source.usage_sentences)) {
      usage = source.usage_sentences.join(" ");
    } else {
      usage = source.usage_sentences || source.usage || source.Usage || "";
    }
    
    const extrasObj = source.extras || source.Extras || source;
    const etymology = extrasObj.origin || extrasObj.Origin || source.etymology || source.origin || "";
    const mnemonic = source.note || extrasObj.mnemonic || extrasObj.Mnemonic || source.mnemonic || "";

    const image = item.image || source.image || "";

    return {
      id: String(id),
      template,
      idiom,
      partOfSpeech,
      meaningEng,
      meaningHindi,
      usage,
      etymology,
      mnemonic,
      image,
      orientation: item.orientation || 'landscape'
    };
  });
};

export const Editor: React.FC<EditorProps> = ({ 
  data, 
  onChange, 
  deck,
  deckSize,
  currentDeckIndex,
  onNavigateDeck,
  onImportBatch
}) => {
  
  // --- State for Paste Modal ---
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteStatus, setPasteStatus] = useState<{valid: boolean; count: number; message: string} | null>(null);

  // --- State for Batch Export Modal ---
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [processingBatchIndex, setProcessingBatchIndex] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [exportOrientation, setExportOrientation] = useState<Orientation>('landscape');

  // Sync default export orientation with current view when opening modal
  useEffect(() => {
    if (showBatchModal) {
      setExportOrientation(data.orientation);
    }
  }, [showBatchModal]);

  const batches = useMemo(() => {
    return chunkArray(deck, 500);
  }, [deck]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const rawItems = Array.isArray(json) ? json : [json];
          const mappedItems = mapRawItemsToFlashcards(rawItems);
          onImportBatch(mappedItems);
          if (jsonInputRef.current) jsonInputRef.current.value = '';
          
          // If a large batch is imported, suggest opening the Batch Manager
          if (mappedItems.length > 500) {
            setShowBatchModal(true);
          }

        } catch (err) {
          alert("Failed to parse JSON");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleJsonExport = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.idiom.replace(/\s+/g, '_').toLowerCase()}_flashcard.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Batch Processing Logic ---
  const processBatch = async (index: number) => {
    if (processingBatchIndex !== null) return;
    
    setProcessingBatchIndex(index);
    const batchItems = batches[index];
    setBatchProgress({ current: 0, total: batchItems.length });

    try {
      const zip = new JSZip();
      const folderName = `batch_${index + 1}_images`;
      const folder = zip.folder(folderName);
      
      // Create a dedicated canvas for processing
      const canvas = document.createElement('canvas');

      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        
        // 1. Yield to Main Thread to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 0));

        // 2. Override orientation with user selection
        const itemToDraw = { ...item, orientation: exportOrientation };

        // 3. Draw to canvas
        await drawCard(canvas, itemToDraw);

        // 4. Convert to Blob
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        
        if (blob && folder) {
          const cleanName = item.idiom.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
          folder.file(`${cleanName}_${i}.png`, blob);
        }

        // 5. Update Progress
        setBatchProgress({ current: i + 1, total: batchItems.length });
      }

      // 6. Generate ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      
      // 7. Download
      const link = document.createElement('a');
      link.href = url;
      link.download = `artisan_batch_${index + 1}_of_${batches.length}_${exportOrientation}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Batch processing failed", err);
      alert("Something went wrong during batch processing.");
    } finally {
      setProcessingBatchIndex(null);
      setBatchProgress(null);
    }
  };

  // --- Paste Logic ---
  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPasteContent(text);
    
    if (!text.trim()) {
      setPasteStatus(null);
      return;
    }

    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        setPasteStatus({ valid: true, count: json.length, message: `Found ${json.length} items.` });
      } else if (typeof json === 'object' && json !== null) {
        setPasteStatus({ valid: true, count: 1, message: 'Found 1 item.' });
      } else {
        setPasteStatus({ valid: false, count: 0, message: 'Invalid format: Must be Object or Array.' });
      }
    } catch (err) {
      setPasteStatus({ valid: false, count: 0, message: 'Invalid JSON syntax.' });
    }
  };

  const confirmPaste = () => {
    if (!pasteStatus?.valid) return;
    try {
      const json = JSON.parse(pasteContent);
      const rawItems = Array.isArray(json) ? json : [json];
      const mappedItems = mapRawItemsToFlashcards(rawItems);
      onImportBatch(mappedItems);
      setShowPasteModal(false);
      setPasteContent('');
      setPasteStatus(null);
      
      if (mappedItems.length > 500) setShowBatchModal(true);

    } catch (e) {
      console.error("Import failed", e);
      alert("Error importing data.");
    }
  };

  const isOws = data.template === 'ows';
  const labelWord = isOws ? 'Word' : 'Idiom / Phrase';
  const labelMnemonic = isOws ? 'Note / Extra Info' : 'Mnemonic (Memory Aid)';
  const labelEtymology = isOws ? 'Origin / Etymology' : 'Etymology / Origin';

  return (
    <div className="h-full flex flex-col bg-[#fdf6e3] border-r border-[#d4c4a8] overflow-y-auto font-serif relative">
      {/* Header */}
      <div className="p-6 border-b border-[#d4c4a8] bg-[#fdf6e3] sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#2c1810] font-['Playfair_Display'] flex items-center gap-2">
            <span className="text-3xl">✒️</span> Artisan Editor
          </h2>
          <p className="text-[#8B4513] text-sm mt-1">Craft your vintage flashcard.</p>
        </div>
        
        {/* Deck Navigation */}
        {deckSize > 1 && (
          <div className="flex items-center gap-2 bg-white border border-[#d4c4a8] rounded-sm px-2 py-1 shadow-sm">
             <button onClick={() => onNavigateDeck('prev')} className="p-1 hover:bg-[#f5e6d3] rounded disabled:opacity-30" disabled={currentDeckIndex === 0}>
               <ChevronLeft className="w-5 h-5 text-[#2c1810]" />
             </button>
             <span className="text-sm font-bold text-[#2c1810] min-w-[3rem] text-center">
               {currentDeckIndex + 1} / {deckSize}
             </span>
             <button onClick={() => onNavigateDeck('next')} className="p-1 hover:bg-[#f5e6d3] rounded disabled:opacity-30" disabled={currentDeckIndex === deckSize - 1}>
               <ChevronRight className="w-5 h-5 text-[#2c1810]" />
             </button>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="p-6 space-y-6 flex-1">
        
        {/* Orientation & Template Toggle */}
        <div className="flex gap-4">
           {/* Orientation */}
           <div className="bg-white p-1 rounded-sm border border-[#d4c4a8] flex gap-1 flex-1">
             <button
               onClick={() => onChange({ ...data, orientation: 'landscape' })}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-sm transition-colors text-xs font-bold uppercase tracking-wider ${data.orientation === 'landscape' ? 'bg-[#2c1810] text-[#fdf6e3]' : 'text-[#2c1810] hover:bg-[#f5e6d3]'}`}
             >
               <RectangleHorizontal className="w-4 h-4" /> Land
             </button>
             <button
               onClick={() => onChange({ ...data, orientation: 'portrait' })}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-sm transition-colors text-xs font-bold uppercase tracking-wider ${data.orientation === 'portrait' ? 'bg-[#2c1810] text-[#fdf6e3]' : 'text-[#2c1810] hover:bg-[#f5e6d3]'}`}
             >
               <RectangleVertical className="w-4 h-4" /> Port
             </button>
           </div>
           
           {/* Template Selector */}
           <div className="bg-white p-1 rounded-sm border border-[#d4c4a8] flex-1">
              <select 
                name="template"
                value={data.template}
                onChange={handleInputChange}
                className="w-full h-full bg-transparent outline-none text-[#2c1810] font-bold text-xs uppercase px-2 text-center cursor-pointer"
              >
                <option value="idiom">Idiom Template</option>
                <option value="ows">One Word (OWS)</option>
              </select>
           </div>
        </div>

        {/* ID and Word/Idiom Input */}
        <div className="flex gap-4">
          <div className="w-20 space-y-2">
             <label className="block text-sm font-bold text-[#2c1810] uppercase tracking-wider">ID</label>
             <input
              type="text"
              name="id"
              value={data.id || ''}
              onChange={handleInputChange}
              className="w-full p-3 bg-white border border-[#d4c4a8] rounded-sm focus:ring-2 focus:ring-[#B8860B] outline-none text-center font-bold text-[#8B4513]"
              placeholder="#"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="block text-sm font-bold text-[#2c1810] uppercase tracking-wider">{labelWord}</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="idiom"
                value={data.idiom}
                onChange={handleInputChange}
                className="flex-1 p-3 bg-white border border-[#d4c4a8] rounded-sm focus:ring-2 focus:ring-[#B8860B] focus:border-transparent outline-none text-lg font-['Playfair_Display'] placeholder-[#d4c4a8]"
                placeholder={isOws ? "e.g. Abbreviation" : "e.g. Break the ice"}
              />
            </div>
          </div>
        </div>

        {/* Part of Speech (OWS Only) */}
        {isOws && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-bold text-[#2C7A7B] uppercase tracking-wider">Part of Speech</label>
            <input
              type="text"
              name="partOfSpeech"
              value={data.partOfSpeech || ''}
              onChange={handleInputChange}
              className="w-full p-3 bg-white border border-[#d4c4a8] rounded-sm focus:ring-2 focus:ring-[#2C7A7B] outline-none font-['Playfair_Display'] italic"
              placeholder="e.g. Noun, Verb"
            />
          </div>
        )}

        {/* Meaning English */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2c1810] uppercase tracking-wider">Meaning (English)</label>
          <textarea
            name="meaningEng"
            value={data.meaningEng}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-3 bg-white border border-[#d4c4a8] rounded-sm focus:ring-2 focus:ring-[#B8860B] outline-none font-['Crimson_Text'] text-lg"
          />
        </div>

        {/* Meaning Hindi */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2c1810] uppercase tracking-wider">Meaning (Hindi)</label>
          <input
            type="text"
            name="meaningHindi"
            value={data.meaningHindi}
            onChange={handleInputChange}
            className="w-full p-3 bg-white border border-[#d4c4a8] rounded-sm focus:ring-2 focus:ring-[#B8860B] outline-none font-['Noto_Sans_Devanagari']"
            placeholder="e.g. चुप्पी तोड़ना"
          />
        </div>

        {/* Usage */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2c1810] uppercase tracking-wider">Usage Sentence</label>
          <textarea
            name="usage"
            value={data.usage}
            onChange={handleInputChange}
            rows={3}
            className="w-full p-3 bg-white border border-[#d4c4a8] rounded-sm focus:ring-2 focus:ring-[#B8860B] outline-none font-['Crimson_Text'] text-lg italic"
          />
        </div>

        {/* Etymology */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2c1810] uppercase tracking-wider">{labelEtymology}</label>
          <textarea
            name="etymology"
            value={data.etymology}
            onChange={handleInputChange}
            rows={2}
            className="w-full p-3 bg-white border border-[#d4c4a8] rounded-sm focus:ring-2 focus:ring-[#B8860B] outline-none font-['Crimson_Text']"
          />
        </div>

        {/* Mnemonic / Note */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#2c1810] uppercase tracking-wider">{labelMnemonic}</label>
          <textarea
            name="mnemonic"
            value={data.mnemonic}
            onChange={handleInputChange}
            rows={2}
            className="w-full p-3 bg-white border border-[#d4c4a8] rounded-sm focus:ring-2 focus:ring-[#B8860B] outline-none font-['Crimson_Text']"
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
           <label className="block text-sm font-bold text-[#2c1810] uppercase tracking-wider">Illustration (Optional)</label>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-[#d4c4a8] bg-white hover:bg-[#f5e6d3] transition-colors rounded-sm text-[#2c1810]"
              >
                <ImageIcon className="w-4 h-4" />
                {data.image ? "Change Image" : "Upload Image"}
              </button>
              {data.image && (
                <button 
                  onClick={() => onChange({...data, image: ''})}
                  className="text-red-800 text-sm hover:underline"
                >
                  Remove
                </button>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload} 
              />
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-[#d4c4a8] bg-[#f9f1e5] flex gap-2">
        <button 
          onClick={() => jsonInputRef.current?.click()}
          className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 border border-[#2c1810] text-[#2c1810] hover:bg-[#eaddcf] transition-colors rounded-sm font-bold text-xs md:text-sm"
        >
          <Upload className="w-4 h-4" /> Import
        </button>
        <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />

        <button 
          onClick={() => setShowPasteModal(true)}
          className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 border border-[#2c1810] text-[#2c1810] hover:bg-[#eaddcf] transition-colors rounded-sm font-bold text-xs md:text-sm"
        >
          <ClipboardPaste className="w-4 h-4" /> Paste
        </button>
        
        {/* Batch Export Button - Only show if we have multiple items */}
        {deckSize > 1 && (
          <button 
            onClick={() => setShowBatchModal(true)}
            className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 border border-[#B8860B] text-[#B8860B] hover:bg-[#fdf6e3] transition-colors rounded-sm font-bold text-xs md:text-sm"
          >
            <Package className="w-4 h-4" /> Batch
          </button>
        )}

        <button 
          onClick={handleJsonExport}
          className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 py-3 bg-[#2c1810] text-[#fdf6e3] hover:bg-[#4a2c20] transition-colors rounded-sm font-bold text-xs md:text-sm"
        >
          <FileJson className="w-4 h-4" /> Export
        </button>
      </div>

      {/* PASTE MODAL */}
      {showPasteModal && (
        <div className="absolute inset-0 z-50 bg-[#2c1810]/80 flex items-center justify-center p-4">
          <div className="bg-[#fdf6e3] w-full max-w-lg rounded-sm shadow-2xl border-2 border-[#B8860B] flex flex-col max-h-[90%]">
            <div className="p-4 border-b border-[#d4c4a8] flex justify-between items-center bg-[#F9F1E5]">
              <h3 className="text-xl font-bold text-[#2c1810] font-['Playfair_Display']">Paste JSON Data</h3>
              <button onClick={() => setShowPasteModal(false)} className="text-[#2c1810] hover:text-[#8B4513]">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col gap-4">
              <p className="text-sm text-[#5d4037]">Paste your JSON object or array of objects below.</p>
              <textarea 
                value={pasteContent}
                onChange={handlePasteChange}
                className="w-full flex-1 min-h-[200px] p-3 border border-[#d4c4a8] bg-white font-mono text-sm resize-none focus:ring-2 focus:ring-[#B8860B] outline-none"
                placeholder='[{"content": {"word": "Abbreviation", ...}}]'
              />
              
              {/* Validation Status */}
              <div className={`p-3 rounded-sm border flex items-center gap-2 ${
                !pasteContent ? 'bg-gray-100 border-gray-300 text-gray-500' :
                pasteStatus?.valid ? 'bg-green-50 border-green-200 text-green-800' : 
                'bg-red-50 border-red-200 text-red-800'
              }`}>
                {!pasteContent ? <div className="w-5 h-5" /> : 
                 pasteStatus?.valid ? <CheckCircle className="w-5 h-5" /> : 
                 <AlertCircle className="w-5 h-5" />}
                <span className="font-bold text-sm">
                  {pasteStatus ? pasteStatus.message : "Waiting for input..."}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-[#d4c4a8] bg-[#F9F1E5] flex justify-end gap-3">
              <button 
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 text-[#2c1810] hover:bg-[#eaddcf] rounded-sm font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmPaste}
                disabled={!pasteStatus?.valid}
                className="px-6 py-2 bg-[#2c1810] text-[#fdf6e3] hover:bg-[#4a2c20] rounded-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import {pasteStatus?.valid && pasteStatus.count > 0 ? `(${pasteStatus.count})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH EXPORT MODAL */}
      {showBatchModal && (
        <div className="absolute inset-0 z-50 bg-[#2c1810]/80 flex items-center justify-center p-4">
           <div className="bg-[#fdf6e3] w-full max-w-2xl rounded-sm shadow-2xl border-2 border-[#B8860B] flex flex-col max-h-[90%]">
             <div className="p-4 border-b border-[#d4c4a8] flex justify-between items-center bg-[#F9F1E5]">
               <div className="flex items-center gap-3">
                 <Package className="w-6 h-6 text-[#B8860B]" />
                 <h3 className="text-xl font-bold text-[#2c1810] font-['Playfair_Display']">Batch Processor</h3>
               </div>
               <button onClick={() => !processingBatchIndex && setShowBatchModal(false)} className="text-[#2c1810] hover:text-[#8B4513] disabled:opacity-30" disabled={processingBatchIndex !== null}>
                 <X className="w-6 h-6" />
               </button>
             </div>

             {/* ORIENTATION CONFIGURATION */}
             <div className="px-4 pt-4 pb-2 bg-white border-b border-[#d4c4a8]">
                <h4 className="font-bold text-[#2c1810] text-xs uppercase tracking-wider mb-2">Export Configuration</h4>
                <div className="flex gap-4">
                   <button
                     onClick={() => setExportOrientation('landscape')}
                     disabled={processingBatchIndex !== null}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-sm border transition-colors text-xs font-bold uppercase tracking-wider ${exportOrientation === 'landscape' ? 'bg-[#2c1810] text-[#fdf6e3] border-[#2c1810]' : 'text-[#2c1810] border-[#d4c4a8] hover:bg-[#f5e6d3]'} disabled:opacity-50`}
                   >
                     <RectangleHorizontal className="w-4 h-4" /> Landscape (1200x800)
                   </button>
                   <button
                     onClick={() => setExportOrientation('portrait')}
                     disabled={processingBatchIndex !== null}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-sm border transition-colors text-xs font-bold uppercase tracking-wider ${exportOrientation === 'portrait' ? 'bg-[#2c1810] text-[#fdf6e3] border-[#2c1810]' : 'text-[#2c1810] border-[#d4c4a8] hover:bg-[#f5e6d3]'} disabled:opacity-50`}
                   >
                     <RectangleVertical className="w-4 h-4" /> Portrait (800x1200)
                   </button>
                </div>
             </div>

             <div className="p-4 overflow-y-auto">
               <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-sm text-[#8B4513] text-sm">
                 <strong>Batch Strategy:</strong> Your {deckSize} items have been split into {batches.length} manageable parts to ensure smooth processing.
               </div>

               <div className="space-y-3">
                 {batches.map((batch, index) => {
                    const isProcessing = processingBatchIndex === index;
                    const isOtherProcessing = processingBatchIndex !== null && processingBatchIndex !== index;
                    const startNum = index * 500 + 1;
                    const endNum = Math.min((index + 1) * 500, deckSize);

                    return (
                      <div key={index} className={`p-4 border rounded-sm flex items-center justify-between transition-colors ${
                        isProcessing ? 'bg-white border-[#B8860B] shadow-md' : 'bg-[#F9F1E5] border-[#d4c4a8]'
                      } ${isOtherProcessing ? 'opacity-50' : ''}`}>
                         
                         <div>
                           <h4 className="font-bold text-[#2c1810]">Part {index + 1}</h4>
                           <p className="text-xs text-[#5d4037] mt-1">Items {startNum} - {endNum} ({batch.length} cards)</p>
                         </div>

                         <div className="flex items-center gap-4">
                           {isProcessing && batchProgress && (
                             <div className="flex flex-col items-end">
                               <div className="flex items-center gap-2 text-[#B8860B] font-bold text-sm">
                                 <Loader2 className="w-4 h-4 animate-spin" />
                                 {batchProgress.current} / {batchProgress.total}
                               </div>
                               <div className="w-24 h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-[#B8860B] transition-all duration-300" 
                                   style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                 />
                               </div>
                             </div>
                           )}

                           <button
                             onClick={() => processBatch(index)}
                             disabled={processingBatchIndex !== null}
                             className={`px-4 py-2 rounded-sm font-bold text-sm transition-colors ${
                               isProcessing 
                               ? 'bg-[#B8860B] text-white'
                               : 'bg-[#2c1810] text-[#fdf6e3] hover:bg-[#4a2c20]'
                             } disabled:opacity-50 disabled:cursor-not-allowed`}
                           >
                             {isProcessing ? 'Processing...' : 'Download ZIP'}
                           </button>
                         </div>
                      </div>
                    );
                 })}
               </div>
             </div>
             
             <div className="p-4 border-t border-[#d4c4a8] bg-[#F9F1E5] text-center text-xs text-[#8B4513]">
               Files are generated client-side. Large batches may take a few moments.
             </div>
           </div>
        </div>
      )}
    </div>
  );
};