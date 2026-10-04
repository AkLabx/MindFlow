import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Upload, Image as ImageIcon, Download, Copy, FileIcon, Shield } from 'lucide-react';
import { encodeStego, decodeStego } from '@/lib/tools/stego';
import { saveFile, copyText } from '@/lib/tools/downloadHelper';

export default function MyStego() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'hide' | 'reveal'>('hide');

  // Hide State
  const [coverImage, setCoverImage] = useState<HTMLImageElement | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [secretText, setSecretText] = useState('');
  const [secretFile, setSecretFile] = useState<File | null>(null);
  const [hideResultUrl, setHideResultUrl] = useState<string | null>(null);
  const [hideResultBlob, setHideResultBlob] = useState<Blob | null>(null);
  const [hideMessage, setHideMessage] = useState('');
  const [hideError, setHideError] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  // Reveal State
  const [revealImage, setRevealImage] = useState<HTMLImageElement | null>(null);
  const [revealResultText, setRevealResultText] = useState<string | null>(null);
  const [revealResultFile, setRevealResultFile] = useState<{name: string, data: Blob} | null>(null);
  const [revealMessage, setRevealMessage] = useState('');
  const [revealError, setRevealError] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const handleImageLoad = (file: File, setter: (img: HTMLImageElement) => void) => {
    const im = new Image();
    const u = URL.createObjectURL(file);
    im.onload = () => {
      setter(im);
      URL.revokeObjectURL(u);
    };
    im.src = u;
  };

  const onHideCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setCoverFile(f);
      handleImageLoad(f, setCoverImage);
      setHideResultUrl(null);
      setHideResultBlob(null);
      setHideMessage('');
    }
  };

  const onHideSecretFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setSecretFile(f);
    }
  };

  const onRevealImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      handleImageLoad(f, setRevealImage);
      setRevealResultText(null);
      setRevealResultFile(null);
      setRevealMessage('');
    }
  };

  const handleHide = async () => {
    if (!coverImage) {
      setHideError(true);
      setHideMessage('Choose a cover image first.');
      return;
    }

    setIsHiding(true);
    setHideMessage('Working...');
    setHideError(false);

    setTimeout(async () => {
      try {
        let type = 0;
        let payload: Uint8Array;

        if (secretFile) {
          type = 1;
          const nameBuf = new TextEncoder().encode(secretFile.name).slice(0, 255);
          const bodyBuf = new Uint8Array(await secretFile.arrayBuffer());
          payload = new Uint8Array(1 + nameBuf.length + bodyBuf.length);
          payload[0] = nameBuf.length;
          payload.set(nameBuf, 1);
          payload.set(bodyBuf, 1 + nameBuf.length);
        } else if (secretText.trim()) {
          type = 0;
          payload = new TextEncoder().encode(secretText);
        } else {
          throw new Error('Type a message or choose a file to hide.');
        }

        const { blob, message, isError } = await encodeStego(coverImage, payload, type);

        if (isError || !blob) {
          throw new Error(message);
        }

        const url = URL.createObjectURL(blob);
        setHideResultBlob(blob);
        setHideResultUrl(url);
        setHideMessage(message);
        setHideError(false);

      } catch (e: any) {
        setHideError(true);
        setHideMessage(e.message);
      } finally {
        setIsHiding(false);
      }
    }, 100);
  };

  const handleReveal = () => {
    if (!revealImage) {
      setRevealError(true);
      setRevealMessage('Choose an image to scan.');
      return;
    }

    setIsRevealing(true);
    setRevealMessage('Scanning...');
    setRevealError(false);
    setRevealResultText(null);
    setRevealResultFile(null);

    setTimeout(() => {
      const result = decodeStego(revealImage);

      if (result.isError) {
        setRevealError(true);
        setRevealMessage(result.message || 'Failed to decode.');
      } else {
        if (result.text !== undefined) {
          setRevealResultText(result.text);
          setRevealMessage('Found hidden text!');
        } else if (result.file) {
          setRevealResultFile(result.file);
          setRevealMessage('Found hidden file!');
        }
      }
      setIsRevealing(false);
    }, 100);
  };

  const saveStegoImage = async () => {
    if (hideResultBlob) {
      await saveFile({
        data: hideResultBlob,
        name: 'hidden.png',
        mime: 'image/png'
      });
    }
  };

  const saveRevealedFile = async () => {
    if (revealResultFile) {
      await saveFile({
        data: revealResultFile.data,
        name: revealResultFile.name,
        mime: revealResultFile.data.type || 'application/octet-stream'
      });
    }
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
            <Shield className="w-5 h-5 text-rose-500" />
            My Stego
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 flex flex-col gap-6 mt-4">

        {/* Tabs */}
        <div className="flex bg-gray-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('hide')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'hide' ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Lock className="w-4 h-4" /> Hide Secret
          </button>
          <button
            onClick={() => setActiveTab('reveal')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'reveal' ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <Unlock className="w-4 h-4" /> Reveal Secret
          </button>
        </div>

        {/* HIDE TAB */}
        {activeTab === 'hide' && (
          <div className="flex flex-col gap-5 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 space-y-4">

                <div>
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">1. Cover Image</label>
                  <label className="block w-full text-center cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 px-4 py-6 rounded-xl transition-colors border-2 border-dashed border-gray-300 dark:border-slate-600">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="font-medium">{coverFile ? coverFile.name : 'Choose Cover Image (PNG or JPG)'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={onHideCoverUpload} />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">2. Secret to Hide</label>
                  <div className="space-y-3">
                    <textarea
                      rows={4}
                      className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-white resize-y focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      placeholder="Type a secret message here..."
                      value={secretText}
                      onChange={e => setSecretText(e.target.value)}
                    />

                    <div className="relative flex items-center py-2">
                       <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
                       <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase">Or</span>
                       <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
                    </div>

                    <label className="block w-full text-center cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl transition-colors border border-gray-300 dark:border-slate-600 flex items-center justify-center gap-2">
                      <FileIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-sm">{secretFile ? secretFile.name : 'Choose a File to Hide'}</span>
                      <input type="file" className="hidden" onChange={onHideSecretFileUpload} />
                    </label>
                    {secretFile && (
                      <div className="flex justify-end">
                        <button onClick={() => setSecretFile(null)} className="text-xs text-rose-500 hover:underline">Remove file</button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleHide}
                  disabled={isHiding || !coverFile}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-4"
                >
                  <Lock className="w-5 h-5" /> {isHiding ? 'Working...' : 'Hide Inside Image'}
                </button>

                {hideMessage && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${hideError ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/30' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30'}`}>
                    {hideMessage}
                  </div>
                )}

                {hideResultUrl && (
                   <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-6">
                     <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-center">Result Image</h3>
                     <img src={hideResultUrl} alt="Result" className="w-full max-w-sm mx-auto rounded-lg shadow-md border border-gray-200 dark:border-slate-700 mb-4" />
                     <button
                       onClick={saveStegoImage}
                       className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                     >
                       <Download className="w-5 h-5" /> Save PNG
                     </button>
                     <p className="text-xs text-center text-gray-500 mt-2">Do not compress or edit this image, or the secret will be destroyed.</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* REVEAL TAB */}
        {activeTab === 'reveal' && (
          <div className="flex flex-col gap-5 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 space-y-4">

                <div>
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Image with Secret</label>
                  <label className="block w-full text-center cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-slate-900/50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 px-4 py-8 rounded-xl transition-colors border-2 border-dashed border-gray-300 dark:border-slate-600">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="font-medium">Upload PNG to Reveal</span>
                    <input type="file" accept="image/png" className="hidden" onChange={onRevealImageUpload} />
                  </label>
                  {revealImage && (
                    <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">Image loaded ready to scan.</p>
                  )}
                </div>

                <button
                  onClick={handleReveal}
                  disabled={isRevealing || !revealImage}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
                >
                  <Unlock className="w-5 h-5" /> {isRevealing ? 'Scanning...' : 'Scan for Secrets'}
                </button>

                {revealMessage && revealError && (
                  <div className="p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/30">
                    {revealMessage}
                  </div>
                )}

                {revealResultText !== null && (
                   <div className="mt-4 border-t border-gray-100 dark:border-slate-700 pt-4">
                     <div className="flex items-center justify-between mb-2">
                       <h3 className="font-bold text-emerald-600 dark:text-emerald-400">Secret Message Found:</h3>
                       <button onClick={() => copyText(revealResultText)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1">
                         <Copy className="w-4 h-4" />
                       </button>
                     </div>
                     <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap font-mono">
                        {revealResultText}
                     </div>
                   </div>
                )}

                {revealResultFile !== null && (
                   <div className="mt-4 border-t border-gray-100 dark:border-slate-700 pt-4">
                     <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-3">Secret File Found:</h3>
                     <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                       <div className="flex items-center gap-3">
                         <FileIcon className="w-8 h-8 text-rose-500" />
                         <div>
                           <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{revealResultFile.name}</p>
                           <p className="text-xs text-gray-500">{(revealResultFile.data.size / 1024).toFixed(1)} KB</p>
                         </div>
                       </div>
                       <button
                         onClick={saveRevealedFile}
                         className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-white p-2 rounded-lg transition-colors"
                       >
                         <Download className="w-5 h-5" />
                       </button>
                     </div>
                   </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
