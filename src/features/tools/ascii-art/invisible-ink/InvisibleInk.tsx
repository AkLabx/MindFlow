import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Eye, EyeOff, FileImage } from 'lucide-react';
import { renderInvisibleInk, InvisibleInkConfig, exif, addExif, nowLocal, pad } from '@/lib/tools/invisibleInk';
import { saveFile } from '@/lib/tools/downloadHelper';

export default function InvisibleInk() {
  const navigate = useNavigate();

  // State configuration matching the original HTML tool
  const [config, setConfig] = useState<InvisibleInkConfig>({
    w: 1080, h: 1080, op: 10,
    bg: 'c', c1: '#f9f9f9', c2: '#aaaaaa', ga: 45,
    dec: 'Open in dark mode\nor click the picture',
    dc: '#333333', dx: 50, dy: 30, ds: 50, dfn: 'Georgia, serif',
    sec: 'Hello!', sx: 50, sy: 70, sr: 0, ss: 110,
    sf: 'ui-monospace, Menlo, Consolas, monospace',
    sb: true, sa: 'center', sl: 1.1, fit: false
  });

  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileDate, setFileDate] = useState(nowLocal());
  const [themeDark, setThemeDark] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const draw = () => {
    if (canvasRef.current) {
      // Calculate display dimensions dynamically based on w/h ratio
      const viewW = Math.min(window.innerWidth - 40, 900); // Max preview width
      const viewH = (config.h / config.w) * viewW;

      // We render at the preview size for speed. Max dimension around 900px
      const scale = Math.min(1, 900 / Math.max(config.w, config.h));
      renderInvisibleInk(canvasRef.current, Math.round(config.w * scale), Math.round(config.h * scale), config, photo);
    }
  };

  const scheduleDraw = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => draw());
  };

  useEffect(() => {
    scheduleDraw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [config, photo]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const im = new Image();
    const u = URL.createObjectURL(file);
    im.onload = () => {
      setPhoto(im);
      setConfig(prev => ({ ...prev, bg: 'photo' }));
      URL.revokeObjectURL(u);
    };
    im.src = u;
  };

  const getFileInfo = () => {
    const [dd, tt] = fileDate.split('T');
    let name = fileName.trim().replace(/[\\/:*?"<>|]/g, '');
    if (!name) name = `IMG_${dd.replace(/-/g, '')}_${tt.replace(':', '')}00`;
    if (!/\.png$/i.test(name)) name += '.png';
    return { name, exif: `${dd.replace(/-/g, ':')} ${tt}:00` };
  };

  const handleSave = async () => {
    const c = document.createElement('canvas');
    // Ensure width/height respect capacitor constraints (approx 3000px native)
    const isNative = typeof window !== "undefined" && !!(window as any).Capacitor;
    const clamp = (v: number) => Math.max(200, Math.min(isNative ? 3000 : 4000, v || 1080));
    const W = clamp(config.w);
    const H = clamp(config.h);

    // Render full size
    renderInvisibleInk(c, W, H, config, photo);

    c.toBlob(async (blob) => {
      if (!blob) return;

      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Prepare EXIF data
      const info = getFileInfo();
      const exData = exif("Invisible Ink", info.exif);

      // Inject EXIF chunk
      const finalBytes = addExif(bytes, exData);
      const finalBlob = new Blob([finalBytes as any], { type: 'image/png' });

      await saveFile({
        data: finalBlob,
        name: info.name,
        mime: 'image/png'
      });

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
            <EyeOff className="w-5 h-5 text-purple-500" />
            Invisible Ink
          </h1>
        </div>
        <button
          onClick={handleSave}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" /> Save
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6 mt-2">

        {/* Preview Frame - THIS MUST REMAIN #fff or #000 REGARDLESS OF GLOBAL THEME */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
             <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Preview (Tap to switch mode)</span>
             <button
               onClick={() => setThemeDark(!themeDark)}
               className="text-xs bg-gray-200 dark:bg-slate-800 px-3 py-1.5 rounded-full flex items-center gap-1 text-gray-700 dark:text-gray-300 transition-colors"
             >
               {themeDark ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>}
               {themeDark ? 'Dark Mode' : 'Light Mode'}
             </button>
          </div>

          <div
            onClick={() => setThemeDark(!themeDark)}
            className={`w-full rounded-2xl border border-gray-300 dark:border-slate-700 p-4 transition-colors duration-500 cursor-pointer flex items-center justify-center min-h-[300px] ${themeDark ? 'bg-black' : 'bg-white'}`}
          >
             <canvas ref={canvasRef} className="max-w-full max-h-[50vh] object-contain block shadow-sm border border-gray-100 dark:border-gray-800" />
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Note: WhatsApp compressions will destroy the hidden message. Send as Document.
          </p>
        </div>

        {/* Configuration Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

           {/* General Settings */}
           <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">Canvas & Background</h3>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Width</label>
                   <input type="number" min="200" max="3000" value={config.w} onChange={e => setConfig({...config, w: Number(e.target.value)})} className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Height</label>
                   <input type="number" min="200" max="3000" value={config.h} onChange={e => setConfig({...config, h: Number(e.target.value)})} className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white" />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">
                  <span>Secret Text Brightness (10-25)</span>
                  <span>{config.op}%</span>
                </label>
                <input type="range" min="3" max="50" value={config.op} onChange={e => setConfig({...config, op: Number(e.target.value)})} className="w-full accent-purple-500" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Background Type</label>
                <div className="flex bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                  {['c', 'grad', 'photo'].map(t => (
                    <button
                      key={t}
                      onClick={() => setConfig({...config, bg: t})}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${config.bg === t ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                    >
                      {t === 'c' ? 'Solid' : t === 'grad' ? 'Gradient' : 'Photo'}
                    </button>
                  ))}
                </div>
              </div>

              {config.bg === 'c' && (
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Color</label>
                   <input type="color" value={config.c1} onChange={e => setConfig({...config, c1: e.target.value})} className="w-full h-10 rounded cursor-pointer" />
                 </div>
              )}
              {config.bg === 'grad' && (
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Color 1</label>
                     <input type="color" value={config.c1} onChange={e => setConfig({...config, c1: e.target.value})} className="w-full h-10 rounded cursor-pointer" />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Color 2</label>
                     <input type="color" value={config.c2} onChange={e => setConfig({...config, c2: e.target.value})} className="w-full h-10 rounded cursor-pointer" />
                   </div>
                   <div className="col-span-2">
                     <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">Angle <span>{config.ga}°</span></label>
                     <input type="range" min="0" max="360" value={config.ga} onChange={e => setConfig({...config, ga: Number(e.target.value)})} className="w-full accent-purple-500" />
                   </div>
                 </div>
              )}
              {config.bg === 'photo' && (
                 <div>
                   <label className="block w-full text-center cursor-pointer bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl transition-colors border border-dashed border-gray-300 dark:border-slate-500">
                     <FileImage className="w-5 h-5 mx-auto mb-1" />
                     <span className="text-sm font-medium">Choose Image</span>
                     <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                   </label>
                 </div>
              )}
           </div>

           {/* Secret Text */}
           <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">Hidden Secret Text</h3>

              <textarea
                rows={3}
                className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-white resize-y"
                value={config.sec}
                onChange={e => setConfig({...config, sec: e.target.value})}
                placeholder="Text hidden in the dark..."
              />

              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">Size <span>{config.ss}</span></label>
                   <input type="range" min="10" max="600" value={config.ss} onChange={e => setConfig({...config, ss: Number(e.target.value)})} className="w-full accent-purple-500" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">Rotate <span>{config.sr}°</span></label>
                   <input type="range" min="-180" max="180" value={config.sr} onChange={e => setConfig({...config, sr: Number(e.target.value)})} className="w-full accent-purple-500" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">X Pos <span>{config.sx}%</span></label>
                   <input type="range" min="0" max="100" value={config.sx} onChange={e => setConfig({...config, sx: Number(e.target.value)})} className="w-full accent-purple-500" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">Y Pos <span>{config.sy}%</span></label>
                   <input type="range" min="0" max="100" value={config.sy} onChange={e => setConfig({...config, sy: Number(e.target.value)})} className="w-full accent-purple-500" />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Font</label>
                <input type="text" value={config.sf} onChange={e => setConfig({...config, sf: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white" />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.sb} onChange={e => setConfig({...config, sb: e.target.checked})} className="rounded text-purple-500 focus:ring-purple-500" />
                  Bold
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={config.fit} onChange={e => setConfig({...config, fit: e.target.checked})} className="rounded text-purple-500 focus:ring-purple-500" />
                  Shrink to fit width
                </label>
              </div>
           </div>

           {/* Visible Decoy Text */}
           <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 space-y-4 md:col-span-2">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">Visible Text (Decoy)</h3>

              <textarea
                rows={2}
                className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-white resize-y"
                value={config.dec}
                onChange={e => setConfig({...config, dec: e.target.value})}
                placeholder="Text visible in light mode..."
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Color</label>
                   <input type="color" value={config.dc} onChange={e => setConfig({...config, dc: e.target.value})} className="w-full h-10 rounded cursor-pointer" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">Size <span>{config.ds}</span></label>
                   <input type="range" min="10" max="600" value={config.ds} onChange={e => setConfig({...config, ds: Number(e.target.value)})} className="w-full accent-purple-500 mt-2" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">X Pos <span>{config.dx}%</span></label>
                   <input type="range" min="0" max="100" value={config.dx} onChange={e => setConfig({...config, dx: Number(e.target.value)})} className="w-full accent-purple-500 mt-2" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex justify-between">Y Pos <span>{config.dy}%</span></label>
                   <input type="range" min="0" max="100" value={config.dy} onChange={e => setConfig({...config, dy: Number(e.target.value)})} className="w-full accent-purple-500 mt-2" />
                 </div>
              </div>
           </div>

           {/* Save Info (EXIF) */}
           <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 space-y-4 md:col-span-2 mb-8">
              <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">File Info (Fake EXIF Data)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You can alter the timestamp embedded inside the image to match a decoy story.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Custom File Name</label>
                   <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} placeholder="Leave empty for auto" className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white" />
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Fake Date/Time</label>
                   <input type="datetime-local" value={fileDate} onChange={e => setFileDate(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
