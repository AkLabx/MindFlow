import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Settings, LogOut, Award, CheckCircle, BarChart, ChevronRight, Pencil, Loader2, AlertTriangle, X } from 'lucide-react';
import defaultAvatar from '../../../assets/default-avatar.svg';

interface ProfilePageProps {
  onNavigateToSettings: () => void;
}

/**
 * Helper function to create an HTMLImageElement from a URL.
 * Required for the canvas drawing operation.
 *
 * @param {string} url - The URL of the image.
 * @returns {Promise<HTMLImageElement>} A promise resolving to the loaded image element.
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Generates a cropped image blob from a source image and crop pixel coordinates.
 *
 * @param {string} imageSrc - The source image URL.
 * @param {object} pixelCrop - The crop area coordinates (x, y, width, height).
 * @returns {Promise<Blob | null>} A promise resolving to the cropped image Blob.
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number; }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = 256;
  canvas.height = 256;
  
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    256,
    256
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

/**
 * User Profile Page Component.
 *
 * Displays user information, avatar, and statistics.
 * Provides functionality to:
 * - View profile details.
 * - Upload and crop a new avatar image.
 * - Navigate to settings.
 * - Sign out.
 *
 * @param {ProfilePageProps} props - The component props.
 * @returns {JSX.Element} The rendered Profile Page.
 */
const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateToSettings }) => {
  const { user, signOut, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cropper States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const reader = new FileReader();
          reader.readAsDataURL(e.target.files[0]);
          reader.addEventListener('load', () => {
              setImageSrc(reader.result as string);
          });
      }
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = async () => {
    if (!user || !croppedAreaPixels || !imageSrc) return;

    setUploading(true);
    setError(null);

    try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        if (!croppedImage) throw new Error('Failed to crop image.');

        const fileExt = 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, croppedImage, { upsert: true, contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update User Profile
        const { error: updateUserError } = await supabase.auth.updateUser({
          data: { avatar_url: `${publicUrl}?t=${new Date().getTime()}` }, // Bust cache
        });

        if (updateUserError) throw updateUserError;

        await refreshUser();
        setImageSrc(null); // Close the cropper modal

    } catch (err: any) {
        setError(`Upload failed: ${err.message}`);
    } finally {
        setUploading(false);
    }
  };
  
  const avatarUrl = user?.user_metadata?.avatar_url || defaultAvatar;

  const stats = [
    { name: 'Quizzes Completed', value: 24, icon: Award },
    { name: 'Correct Answers', value: '1,200', icon: CheckCircle },
    { name: 'Average Score', value: '85%', icon: BarChart },
  ];

  if (!user) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
  }

  return (
    <>
      {/* --- Image Cropper Modal --- */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4 animate-fade-in">
          <div className="relative w-full max-w-sm h-64 sm:h-80 md:h-96">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
          </div>
          <div className="mt-4 w-full max-w-sm">
              <input 
                type="range" 
                min={1} max={3} step={0.1} 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
          </div>
          <div className="flex gap-4 mt-6">
              <button onClick={() => setImageSrc(null)} disabled={uploading} className="px-6 py-2 bg-slate-600 text-white font-bold rounded-lg shadow-md hover:bg-slate-700 transition-colors flex items-center gap-2">
                  <X className="w-5 h-5" /> Cancel
              </button>
              <button onClick={handleAvatarUpload} disabled={uploading} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  {uploading ? <><Loader2 className="w-5 h-5 animate-spin"/> Cropping...</> : <> <CheckCircle className="w-5 h-5" /> Apply </>}
              </button>
          </div>
        </div>
      )}

      <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/30 overflow-hidden">
            <div className="relative h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="p-6 pb-8 text-center relative">
              
              <div className="relative w-28 h-28 mx-auto -mt-20">
                  <img src={avatarUrl} alt="User Avatar" className="w-28 h-28 rounded-full border-4 border-white shadow-lg" />
                  <input type="file" ref={avatarInputRef} className="hidden" onChange={handleFileSelect} accept="image/png, image/jpeg" />
                  <button
                      onClick={handleAvatarClick}
                      className="absolute bottom-1 right-1 w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-indigo-700 transition-all duration-300 shadow-md group"
                      aria-label="Change profile picture"
                  >
                      <Pencil className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                  <h1 className="text-3xl font-black text-slate-800">{user.user_metadata?.full_name || user.email}</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">PRO</span>
              </div>
              <p className="text-slate-500 font-medium mt-1">{user.email}</p>

              {error && (
                  <div className="mt-4 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4"/>
                      <span>{error}</span>
                  </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{stat.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
              <button onClick={onNavigateToSettings} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600"><Settings className="w-5 h-5" /></div>
                      <div>
                          <h3 className="font-bold text-slate-800 text-left">Profile Settings</h3>
                          <p className="text-xs text-slate-500 font-medium">Update your name, email, and password</p>
                      </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button onClick={signOut} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600"><LogOut className="w-5 h-5" /></div>
                       <div>
                          <h3 className="font-bold text-red-700 text-left">Sign Out</h3>
                          <p className="text-xs text-slate-500 font-medium">You will be returned to the login screen</p>
                      </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
              </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default ProfilePage;
