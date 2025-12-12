import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronRight, Map, ArrowDown, Loader2 } from 'lucide-react';
import { OneWord } from '../../../types/models';
import { cn } from '../../../../utils/cn';
import { APP_CONFIG } from '../../../constants/config';
import { usePDFGenerator } from '../../../hooks/usePDFGenerator';
import { useJSONDownloader } from '../../../hooks/useJSONDownloader';
import { generateOWSPDF } from '../utils/pdfGenerator';
import { DownloadOptionsModal } from '../../../components/ui/DownloadOptionsModal';

/**
 * Props for the OWSNavigationPanel component.
 */
interface OWSNavigationPanelProps {
  /** Whether the panel is currently open. */
  isOpen: boolean;
  /** Callback to close the panel. */
  onClose: () => void;
  /** The list of OWS data items. */
  data: OneWord[];
  /** The index of the currently active item. */
  currentIndex: number;
  /** Callback to jump to a specific item index. */
  onJump: (index: number) => void;
}

/**
 * A side drawer navigation panel for the OWS session.
 *
 * Provides an overview map of all words in the current session, grouped by chunks.
 * Allows quick navigation to specific words and downloading flashcards as PDF.
 *
 * @param {OWSNavigationPanelProps} props - The component props.
 * @returns {JSX.Element | null} The rendered panel or null if closed.
 */
export const OWSNavigationPanel: React.FC<OWSNavigationPanelProps> = ({
  isOpen, onClose, data, currentIndex, onJump
}) => {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());

  // Generators
  const { generatePDF, isGenerating: isGeneratingPDF, error: pdfError } = usePDFGenerator(generateOWSPDF);
  const { downloadJSON, isGenerating: isGeneratingJSON, error: jsonError } = useJSONDownloader<OneWord>();

  // State to track which chunk is currently being downloaded (to show spinner in list)
  const [downloadingChunk, setDownloadingChunk] = useState<number | null>(null);

  // State to manage the download options modal
  const [downloadModalState, setDownloadModalState] = useState<{
    chunkIndex: number;
    start: number;
    end: number;
  } | null>(null);

  // Initialize batch size from local storage or default to 50
  const [chunkSize, setChunkSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.OWS_BATCH_SIZE);
      return saved ? parseInt(saved, 10) : 50;
    } catch {
      return 50;
    }
  });

  const batchOptions = [5, 10, 15, 20, 25, 30, 40, 50, 100];

  // Persist batch size changes
  useEffect(() => {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.OWS_BATCH_SIZE, chunkSize.toString());
  }, [chunkSize]);

  // Auto-expand current group on open or when chunkSize changes
  useEffect(() => {
    if (isOpen) {
      const currentGroup = Math.floor(currentIndex / chunkSize);
      setOpenGroups(new Set([currentGroup]));
    }
  }, [isOpen, currentIndex, chunkSize]);

  if (!isOpen) return null;

  const totalChunks = Math.ceil(data.length / chunkSize);

  /** Toggles the expansion state of a word group. */
  const toggleGroup = (index: number) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  /** Opens the download options modal. */
  const handleDownloadClick = (e: React.MouseEvent, chunkIndex: number, start: number, end: number) => {
    e.stopPropagation();
    if (isGeneratingPDF || isGeneratingJSON) return;
    setDownloadModalState({ chunkIndex, start, end });
  };

  /** Handles PDF generation */
  const handleDownloadPDF = async () => {
    if (!downloadModalState) return;
    const { chunkIndex, start, end } = downloadModalState;

    setDownloadingChunk(chunkIndex);
    const chunkData = data.slice(start, end);
    const fileName = `OWS_Flashcards_Part_${chunkIndex + 1}_(${start + 1}-${end}).pdf`;

    await generatePDF(chunkData, { fileName });
    setDownloadingChunk(null);
    setDownloadModalState(null);
  };

  /** Handles JSON download */
  const handleDownloadJSON = async () => {
    if (!downloadModalState) return;
    const { chunkIndex, start, end } = downloadModalState;

    setDownloadingChunk(chunkIndex);
    const chunkData = data.slice(start, end);
    const fileName = `OWS_Flashcards_Part_${chunkIndex + 1}_(${start + 1}-${end}).json`;

    await downloadJSON(chunkData, fileName);
    setDownloadingChunk(null);
    setDownloadModalState(null);
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[70] flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-teal-100 bg-teal-50 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-teal-900 leading-tight">Word Map</h2>
                <p className="text-xs text-teal-700 font-medium">{data.length} items total</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-teal-200/50 rounded-full text-teal-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Batch Size Selector */}
          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-teal-200">
            <label htmlFor="batch-size" className="text-xs font-semibold text-teal-800 pl-1">
              Group Size:
            </label>
            <select
              id="batch-size"
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value, 10))}
              className="text-sm font-medium text-teal-900 bg-teal-50 border-none rounded focus:ring-2 focus:ring-teal-500 py-1 pl-2 pr-8 cursor-pointer outline-none"
            >
              {batchOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {(pdfError || jsonError) && (
             <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
               Failed to generate download. Please try again.
             </div>
          )}
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scrollbar-thin scrollbar-thumb-teal-200">
          {Array.from({ length: totalChunks }).map((_, chunkIndex) => {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, data.length);
            const isOpen = openGroups.has(chunkIndex);

            // Show spinner if this chunk is downloading (via PDF or JSON)
            const isDownloading = downloadingChunk === chunkIndex;

            const containsCurrent = currentIndex >= start && currentIndex < end;

            return (
              <div key={chunkIndex} className={cn(
                "border rounded-xl overflow-hidden transition-all duration-200",
                containsCurrent ? "border-teal-300 shadow-sm bg-white" : "border-gray-200 bg-white"
              )}>
                <div
                  onClick={() => toggleGroup(chunkIndex)}
                  className={cn(
                    "w-full flex items-center justify-between p-3.5 text-sm font-bold transition-colors cursor-pointer",
                    containsCurrent ? "bg-teal-50 text-teal-800" : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <span>Words {start + 1} - {end}</span>
                  <div className="flex items-center gap-2">
                     <button
                        onClick={(e) => handleDownloadClick(e, chunkIndex, start, end)}
                        disabled={isGeneratingPDF || isGeneratingJSON}
                        className="p-1.5 hover:bg-black/10 rounded-full text-current transition-colors disabled:opacity-50"
                        title="Download Flashcards"
                     >
                        {isDownloading ? (
                           <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                           <ArrowDown className="w-4 h-4" />
                        )}
                     </button>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-teal-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="p-3 grid grid-cols-5 gap-2 bg-white border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                    {data.slice(start, end).map((item, localIdx) => {
                      const globalIdx = start + localIdx;
                      const isCurrent = globalIdx === currentIndex;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onJump(globalIdx);
                            onClose();
                          }}
                          title={item.content.word}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative overflow-hidden",
                            isCurrent
                              ? "bg-teal-500 text-white shadow-md ring-2 ring-teal-300 ring-offset-1 scale-105 z-10"
                              : "bg-gray-50 border border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-600 hover:text-teal-900"
                          )}
                        >
                          {globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Download Options Modal */}
      <DownloadOptionsModal
        isOpen={!!downloadModalState}
        onClose={() => !isGeneratingPDF && !isGeneratingJSON && setDownloadModalState(null)}
        onDownloadPDF={handleDownloadPDF}
        onDownloadJSON={handleDownloadJSON}
        isGeneratingPDF={isGeneratingPDF}
        isGeneratingJSON={isGeneratingJSON}
      />
    </>,
    document.body
  );
};
