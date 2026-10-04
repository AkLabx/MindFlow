import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Copy, Settings, Image as ImageIcon } from 'lucide-react';
import { buildNumberArt, paintNumberArt, NumberArtConfig, NumberArtResult, getAsText, PRESETS, LH } from '@/lib/tools/numberArt';
import { saveFile, copyText } from '@/lib/tools/downloadHelper';

export default function NumberArt() {
  const navigate = useNavigate();

  // State
  const [config, setConfig] = useState<NumberArtConfig>({
    chars: PRESETS['num'],
    isBold: true,
    cols: 120,
    matchMode: 'shape',
    autoLevels: true,
    contrast: 1.1,
    brightness: 0,
    colorMode: 'bw'
  });
  const [customChars, setCustomChars] = useState('0123456789');
  const [presetSelection, setPresetSelection] = useState('num');

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [result, setResult] = useState<NumberArtResult | null>(null);
  const [statusMsg, setStatusMsg] = useState('Pick a picture to start.');
  const [isWorking, setIsWorking] = useState(false);
  const [savedSize, setSavedSize] = useState('32');
  const [zoom, setZoom] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const im = new Image();
    const u = URL.createObjectURL(file);

    im.onload = () => {
      setImage(im);
      URL.revokeObjectURL(u);
    };
    im.onerror = () => {
      setStatusMsg('Could not open that picture (HEIC is not supported). Try a JPG or PNG.');
    };
    im.src = u;
  };

  // Rebuild when config or image changes
  useEffect(() => {
    if (!image) return;

    setIsWorking(true);
    setStatusMsg('Working...');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const { result: newResult, message } = buildNumberArt(image, config);
      setResult(newResult);
      setStatusMsg(message);

      if (newResult && canvasRef.current) {
        paintNumberArt(canvasRef.current, newResult, 16, config.isBold);
      }
      setIsWorking(false);
    }, 150);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [image, config]);

  // Update chars when preset changes
  useEffect(() => {
    if (presetSelection === 'custom') {
      setConfig(prev => ({ ...prev, chars: customChars }));
    } else {
      setConfig(prev => ({ ...prev, chars: PRESETS[presetSelection] }));
    }
  }, [presetSelection, customChars]);

  const handleCopy = async () => {
    if (!result) return;
    await copyText(getAsText(result));
  };

  const handleSaveText = async () => {
    if (!result) return;
    const txt = getAsText(result);
    await saveFile({
      data: txt,
      name: 'number-art.txt',
      mime: 'text/plain'
    });
  };

  const handleSaveImage = async () => {
    if (!result) return;
    const c = document.createElement('canvas');
    const size = Math.min(parseInt(savedSize), 8000 / Math.max(result.cols * 0.65, result.rows * LH));

    paintNumberArt(c, result, size, config.isBold);

    c.toBlob(async (blob) => {
      if (blob) {
        await saveFile({
          data: blob,
          name: 'number-art.png',
          mime: 'image/png'
        });
      }
    }, 'image/png');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tools/ascii-art-hub')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-500" />
            Number Art
          </h1>
        </div>

        <div className="flex gap-2">
           <label className="cursor-pointer p-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/50 rounded-full transition-colors text-indigo-600 dark:text-indigo-300">
            <Upload className="w-5 h-5" />
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 flex flex-col lg:flex-row gap-6 mt-4">
        {/* Controls Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 space-y-5">

            {/* 1. Letters */}
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 border-b dark:border-white/10 pb-1">1. Letters</h3>
              <div className="space-y-3">
                <select
                  className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                  value={presetSelection}
                  onChange={e => setPresetSelection(e.target.value)}
                >
                  <option value="num">Numbers</option>
                  <option value="hex">Hexadecimal</option>
                  <option value="bin">Binary 01</option>
                  <option value="blocks">Blocks ░▒▓█</option>
                  <option value="ascii">ASCII</option>
                  <option value="custom">My own characters</option>
                </select>

                {presetSelection === 'custom' && (
                  <input
                    type="text"
                    className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                    value={customChars}
                    onChange={e => setCustomChars(e.target.value)}
                  />
                )}

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.isBold} onChange={e => setConfig({...config, isBold: e.target.checked})} className="rounded text-indigo-500 focus:ring-indigo-500" />
                  Bold font
                </label>
              </div>
            </div>

            {/* 2. Detail */}
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-3 border-b dark:border-white/10 pb-1">2. Detail</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Characters across</span>
                    <span>{config.cols}</span>
                  </div>
                  <input type="range" min="40" max="240" step="2" value={config.cols} onChange={e => setConfig({...config, cols: parseInt(e.target.value)})} className="w-full accent-indigo-500" />
                </div>

                <select
                  className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                  value={config.matchMode}
                  onChange={e => setConfig({...config, matchMode: e.target.value as 'shape' | 'tone'})}
                >
                  <option value="shape">Shape match (most accurate)</option>
                  <option value="tone">Tone only (faster)</option>
                </select>
                <p className="text-xs text-gray-500">Shape match compares the real outline of each number with the picture.</p>
              </div>
            </div>

            {/* 3. Tone */}
            <div>
               <h3 className="font-bold text-gray-800 dark:text-white mb-3 border-b dark:border-white/10 pb-1">3. Tone</h3>
               <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.autoLevels} onChange={e => setConfig({...config, autoLevels: e.target.checked})} className="rounded text-indigo-500 focus:ring-indigo-500" />
                  Auto levels
                </label>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Contrast</span>
                    <span>{config.contrast.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.5" max="2.5" step="0.05" value={config.contrast} onChange={e => setConfig({...config, contrast: parseFloat(e.target.value)})} className="w-full accent-indigo-500" />
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Brightness</span>
                    <span>{config.brightness.toFixed(2)}</span>
                  </div>
                  <input type="range" min="-0.4" max="0.4" step="0.02" value={config.brightness} onChange={e => setConfig({...config, brightness: parseFloat(e.target.value)})} className="w-full accent-indigo-500" />
                </div>
               </div>
            </div>

            {/* 4. Look and Output */}
            <div>
               <h3 className="font-bold text-gray-800 dark:text-white mb-3 border-b dark:border-white/10 pb-1">4. Output</h3>
               <div className="space-y-3">
                <select
                  className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                  value={config.colorMode}
                  onChange={e => setConfig({...config, colorMode: e.target.value as any})}
                >
                  <option value="bw">Black on white</option>
                  <option value="wb">White on black</option>
                  <option value="col">Coloured on black</option>
                </select>

                <select
                  className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                  value={savedSize}
                  onChange={e => setSavedSize(e.target.value)}
                >
                  <option value="20">Standard Size PNG</option>
                  <option value="32">Large Size PNG</option>
                  <option value="48">Huge Size PNG</option>
                </select>
               </div>
            </div>

          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col gap-4">

          <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 px-4 py-3 rounded-xl text-sm font-medium border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between">
            <span className={isWorking ? "animate-pulse" : ""}>{statusMsg}</span>
            {result && (
               <button onClick={() => setZoom(!zoom)} className="text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-slate-700 transition-colors">
                 {zoom ? 'Fit to screen' : 'Zoom to 100%'}
               </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex-1 relative overflow-hidden flex flex-col">

            {!image ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                <p>Upload an image to generate art.</p>
                <label className="mt-4 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl transition-colors shadow-sm font-medium">
                  Choose File
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-slate-900/50 rounded-t-2xl">
                <canvas
                  ref={canvasRef}
                  className={`max-w-full shadow-lg rounded ${!zoom ? 'max-h-[60vh] object-contain' : ''} transition-all duration-300`}
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="border-t border-gray-100 dark:border-white/5 p-4 flex flex-wrap gap-3 bg-gray-50 dark:bg-slate-800/80 rounded-b-2xl">
              <button
                disabled={!result}
                onClick={handleSaveText}
                className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                <Download className="w-4 h-4" /> Save .txt
              </button>

              <button
                disabled={!result}
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-white border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                <Copy className="w-4 h-4" /> Copy Text
              </button>

              <button
                disabled={!result}
                onClick={handleSaveImage}
                className="flex-[2] flex items-center justify-center gap-2 bg-indigo-500 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                <Download className="w-4 h-4" /> Save PNG Image
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
