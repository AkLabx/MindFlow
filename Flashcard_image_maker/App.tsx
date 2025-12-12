
import React, { useState } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { FlashcardData, INITIAL_FLASHCARD_DATA } from './types';
import { Layers, Eye } from 'lucide-react';

const App: React.FC = () => {
  // Initialize state with auto-detected orientation for mobile
  const [data, setData] = useState<FlashcardData>(() => ({
    ...INITIAL_FLASHCARD_DATA,
    orientation: typeof window !== 'undefined' && window.innerWidth < 768 ? 'portrait' : 'landscape'
  }));

  // Deck State for multiple items
  const [deck, setDeck] = useState<FlashcardData[]>([]);
  const [currentDeckIndex, setCurrentDeckIndex] = useState<number>(-1);
  
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const handleDataChange = (newData: FlashcardData) => {
    setData(newData);
    
    // If we are editing a card inside a deck, sync the changes back to the deck
    if (currentDeckIndex >= 0 && deck.length > 0) {
      const newDeck = [...deck];
      newDeck[currentDeckIndex] = newData;
      setDeck(newDeck);
    }
  };

  const handleImportBatch = (items: FlashcardData[]) => {
    if (items.length === 0) return;
    setDeck(items);
    setCurrentDeckIndex(0);
    setData(items[0]);
  };

  const handleNavigateDeck = (direction: 'prev' | 'next') => {
    if (deck.length === 0) return;
    
    let newIndex = currentDeckIndex;
    if (direction === 'prev') {
      newIndex = Math.max(0, currentDeckIndex - 1);
    } else {
      newIndex = Math.min(deck.length - 1, currentDeckIndex + 1);
    }

    if (newIndex !== currentDeckIndex) {
      setCurrentDeckIndex(newIndex);
      setData(deck[newIndex]);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans">
      
      {/* Desktop Layout: Split Pane */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-[450px] lg:w-[500px] flex-shrink-0 h-full">
          <Editor 
            data={data} 
            onChange={handleDataChange} 
            deck={deck}
            deckSize={deck.length}
            currentDeckIndex={currentDeckIndex}
            onNavigateDeck={handleNavigateDeck}
            onImportBatch={handleImportBatch}
          />
        </div>
        <div className="flex-1 h-full bg-[#2c1810]">
          <Preview data={data} />
        </div>
      </div>

      {/* Mobile Layout: Tabs */}
      <div className="md:hidden flex flex-col w-full h-full">
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'editor' ? (
            <Editor 
              data={data} 
              onChange={handleDataChange} 
              deck={deck}
              deckSize={deck.length}
              currentDeckIndex={currentDeckIndex}
              onNavigateDeck={handleNavigateDeck}
              onImportBatch={handleImportBatch}
            />
          ) : (
            <Preview data={data} />
          )}
        </div>
        
        {/* Mobile Tab Bar */}
        <div className="h-16 bg-[#2c1810] flex text-[#fdf6e3]">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'editor' ? 'bg-[#3e2318] text-[#B8860B]' : ''}`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider">EDITOR</span>
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${activeTab === 'preview' ? 'bg-[#3e2318] text-[#B8860B]' : ''}`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider">PREVIEW</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default App;