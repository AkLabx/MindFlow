import React, { useState } from 'react';
import { useAuth } from '../../../features/auth/context/AuthContext';
import { useNotification } from '../../../hooks/useNotification';
import { uploadMediaToCloudinary } from '../../../services/mediaUploadService';
import { useQuestionImage } from '../hooks/useQuestionImage';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
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

  const { imageUrl, updateImage, isUpdating, isFetching } = useQuestionImage(
    questionId || '',
    kind,
    initialImageUrl,
    isVisible
  );

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

    try {
      await updateImage({ url: null });
      showToast({ title: 'Success', message: 'Image removed successfully.', variant: 'success' });
    } catch (error: any) {
      console.error("Delete error:", error);
      showToast({ title: 'Delete Failed', message: error.message || 'Failed to remove image.', variant: 'error' });
    }
  };

  const isWorking = isUploading || isUpdating;

  const getTransformedUrl = (url: string) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
  };

  const displayUrl = imageUrl ? getTransformedUrl(imageUrl) : null;

  return (
    <div className="w-full mt-4 flex flex-col gap-2">
      {displayUrl && (
        <div className="relative group w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-sm">
          <div className="relative w-full aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden">
            {isFetching && !imageUrl && (
                 <Loader2 className="absolute text-indigo-500 w-8 h-8 animate-spin z-10" />
            )}
            <img
              src={displayUrl}
              alt={`Question ${kind}`}
              loading="lazy"
              className="w-full h-full object-contain"
            />
          </div>

          {isAdmin && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleImageRemove}
                disabled={isWorking}
                className="w-11 h-11 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove Image"
              >
                {isWorking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      )}

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
              "w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors min-h-[100px]",
              isWorking
                ? "border-indigo-300 bg-indigo-50 opacity-70 cursor-not-allowed"
                : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-gray-700 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20"
            )}
          >
            {isWorking ? (
              <div className="flex items-center gap-2 text-indigo-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <ImagePlus className="w-5 h-5" />
                <span className="text-sm font-medium">Admin: Add {kind === 'explanation' ? 'Explanation' : 'Question'} Image</span>
              </div>
            )}
          </label>
        </div>
      )}
    </div>
  );
};
