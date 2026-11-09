import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useNotification } from '../../../hooks/useNotification';
import { uploadMediaToCloudinary } from '../../../services/mediaUploadService';
import { useQuestionImage } from '../hooks/useQuestionImage';
import { useQuizSessionStore } from '../stores/useQuizSessionStore';
import { 
  ImagePlus, 
  Trash2, 
  Loader2, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { cn } from '../../../utils/cn';

interface AdminQuestionImageProps {
  questionId?: string;
  kind: 'explanation' | 'question';
  initialImageUrl?: string;
  isVisible?: boolean;
}

export const AdminQuestionImage: React.FC<AdminQuestionImageProps> = ({
  questionId,
  kind,
  initialImageUrl,
  isVisible = true
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useNotification();
  const [isUploading, setIsUploading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { imageUrl, updateImage, isUpdating, isFetching } = useQuestionImage(
    questionId || '',
    kind,
    initialImageUrl,
    isVisible
  );

  // Sync with useQuizSessionStore on image updates
  const syncWithQuizStore = (newUrl: string | null) => {
    if (!questionId) return;
    try {
      const activeQuestions = useQuizSessionStore.getState().activeQuestions;
      const targetQuestion = activeQuestions.find((q) => q.id === questionId);
      if (targetQuestion) {
        const column = kind === 'explanation' ? 'explanation_image_url' : 'question_image_url';
        useQuizSessionStore.getState().hydrateQuestions([
          {
            ...targetQuestion,
            [column]: newUrl || undefined
          }
        ]);
      }
    } catch (err) {
      console.warn("Failed to sync question image with quiz store:", err);
    }
  };

  // Keyboard navigation for Lightbox (Escape to close, +/- to zoom)
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(prev + 0.5, 3));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel((prev) => Math.max(prev - 0.5, 1));
      } else if (e.key === '0') {
        setZoomLevel(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  if (!questionId) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({ title: 'Error', message: 'Image must be under 5MB', variant: 'error' });
      return;
    }

    setIsUploading(true);

    try {
      const folderPath = kind === 'explanation'
        ? 'mindflow/gk-questions/explanation'
        : 'mindflow/gk-questions/question';

      const url = await uploadMediaToCloudinary({
        file,
        resourceType: 'image',
        folder: folderPath
      });

      await updateImage({ url });
      syncWithQuizStore(url);
      showToast({ title: 'Success', message: 'Image uploaded successfully!', variant: 'success' });
    } catch (error: any) {
      console.error("Upload error:", error);
      showToast({ title: 'Upload Failed', message: error.message || 'Failed to upload image.', variant: 'error' });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleImageRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;

    if (!window.confirm(`Are you sure you want to remove this ${kind} image?`)) {
      return;
    }

    try {
      await updateImage({ url: null });
      syncWithQuizStore(null);
      showToast({ title: 'Success', message: 'Image removed successfully.', variant: 'success' });
    } catch (error: any) {
      console.error("Delete error:", error);
      showToast({ title: 'Delete Failed', message: error.message || 'Failed to remove image.', variant: 'error' });
    }
  };

  const isWorking = isUploading || isUpdating;

  // Cloudinary thumbnail optimization (f_auto, q_auto, w_800)
  const getThumbnailUrl = (url: string) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
  };

  const displayUrl = imageUrl ? getThumbnailUrl(imageUrl) : null;
  const rawUrl = imageUrl || null;

  return (
    <div className="w-full mt-3 flex flex-col gap-2">
      {displayUrl && (
        <div className="relative group w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-sm transition-all hover:shadow-md">
          {/* Main Thumbnail Container with Click to Expand */}
          <div
            onClick={() => {
              setIsLightboxOpen(true);
              setZoomLevel(1);
            }}
            className="relative w-full aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden cursor-zoom-in bg-slate-900/5 dark:bg-slate-900/30"
            title="Tap to expand full screen"
          >
            {isFetching && !imageUrl && (
              <Loader2 className="absolute text-indigo-500 w-8 h-8 animate-spin z-10" />
            )}
            <img
              src={displayUrl}
              alt={`Question ${kind} diagram`}
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {/* Bottom-left Hint: Tap to Expand */}
            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[11px] font-medium flex items-center gap-1.5 opacity-90 transition-opacity pointer-events-none">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Tap to Zoom</span>
            </div>
          </div>

          {/* Touch-Friendly Mobile & Desktop Admin Action Controls */}
          {isAdmin && (
            <div
              className="absolute top-2.5 right-2.5 flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-md rounded-xl z-20 shadow-lg border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hidden File Input for Direct Replacement */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isWorking}
                className="hidden"
                id={`admin-replace-image-${kind}-${questionId}`}
              />

              {/* Replace Image Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isWorking}
                className="p-2 text-white hover:text-indigo-300 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                title="Replace Image"
                aria-label="Replace Image"
              >
                {isWorking ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
              </button>

              <div className="w-px h-4 bg-white/20"></div>

              {/* Remove Image Button */}
              <button
                type="button"
                onClick={handleImageRemove}
                disabled={isWorking}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                title="Remove Image"
                aria-label="Remove Image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admin Upload Zone (When No Image Exists) */}
      {!displayUrl && isAdmin && (
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isWorking}
            className="hidden"
            id={`admin-q-image-upload-${kind}-${questionId}`}
          />
          <label
            htmlFor={`admin-q-image-upload-${kind}-${questionId}`}
            className={cn(
              "w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all min-h-[105px]",
              isWorking
                ? "border-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/20 opacity-70 cursor-not-allowed"
                : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/40 dark:border-gray-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/20"
            )}
          >
            {isWorking ? (
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-semibold">Uploading to Cloudinary...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-0.5">
                  <ImagePlus className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                  Admin: Attach {kind === 'explanation' ? 'Explanation' : 'Question'} Diagram
                </span>
                <span className="text-[10px] text-gray-400">Supports PNG, JPG, WebP up to 5MB</span>
              </div>
            )}
          </label>
        </div>
      )}

      {/* ============================================================== */}
      {/* FULL-SCREEN PINCH-AND-PAN LIGHTBOX MODAL                       */}
      {/* ============================================================== */}
      {isLightboxOpen && rawUrl && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
          onClick={() => {
            setIsLightboxOpen(false);
            setZoomLevel(1);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Detailed ${kind} diagram view`}
        >
          {/* Lightbox Toolbar */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 z-10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-wide uppercase">
                {kind === 'explanation' ? 'Explanation Diagram' : 'Question Diagram'}
              </span>
              <span className="text-[11px] font-mono text-gray-400 px-2 py-0.5 bg-white/10 rounded">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(prev - 0.5, 1))}
                disabled={zoomLevel <= 1}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Reset Zoom */}
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Reset Zoom (1:1)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(prev + 0.5, 3))}
                disabled={zoomLevel >= 3}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-5 bg-white/20 mx-1"></div>

              {/* Open High-Res in New Window */}
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Open high-resolution original"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Close Lightbox */}
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Canvas Area */}
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4 select-none cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsLightboxOpen(false);
                setZoomLevel(1);
              }
            }}
          >
            <div
              className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={rawUrl}
                alt={`Full-resolution ${kind} diagram`}
                className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>

          {/* Lightbox Footer Guidance */}
          <div className="py-2 text-center text-xs text-gray-400 bg-black/40 border-t border-white/5 shrink-0">
            Use pinch or +/- buttons to inspect fine diagram labels • Press Esc to exit
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
