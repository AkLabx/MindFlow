import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { useDebugStore } from '../../../stores/useDebugStore';
import { PresenceAvatar } from '../../../components/ui/PresenceAvatar';
import { PresenceDot } from '../../../components/ui/PresenceDot';
import Cropper from 'react-easy-crop';
import { useAuth } from '../context/AuthContext';
import { AuthPolicy } from '@/lib/navigation/policies/AuthPolicy';
import { supabase } from '../../../lib/supabase';
import {
    LogOut, Settings2, ChevronRight, CheckCircle, BarChart,
    Pencil, AlertTriangle, Loader2, X, Clock, Target,
    FileText, Bookmark, Grid, CreditCard, Shield, HelpCircle, Copy, Check
} from 'lucide-react';
import { useProfileStats } from '../hooks/useProfileStats';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from "../../../stores/useNotificationStore";
import { useQueryClient } from '@tanstack/react-query';
import { getCanonicalAvatarUrl } from '../../../utils/avatar';
import { getUserDisplayName } from '../../../utils/user';
import { useExamContextStore } from '@/stores/useExamContextStore';
import {
    ManageTargetExamsModal,
    CANONICAL_EXAMS,
    computeExamCounts,
    getCanonicalExamById,
} from '@/features/dashboard';
import { useQuestionMetadata } from '@/features/quiz/hooks/useQuestionMetadata';
import { triggerHaptic } from '@/lib/haptics';
import { ROUTES } from '@/config/routes';

const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=e2e8f0';

// --- Image Cropping Utility ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Extracts the cropped region from an image and returns a Blob.
 *
 * @param {string} imageSrc - The source URL/Data URI of the original image.
 * @param {object} pixelCrop - The pixel coordinates and dimensions of the crop box.
 * @returns {Promise<Blob | null>} A Promise resolving to the cropped image Blob.
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set canvas dimensions to the crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped portion onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Asynchronously convert the canvas to a Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.95); // High quality JPEG
  });
}

interface ProfilePageProps {
  onSignOut?: () => void;
  onNavigateToSettings: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onSignOut, onNavigateToSettings }) => {
  const { user, profile, roles, isAdmin, refreshProfile, signOut, refreshUser } = useAuth();
  const hasAdminPrivileges = isAdmin || AuthPolicy.isAdmin(user, profile, roles);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useNotificationStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toggleOpen: toggleDebug } = useDebugStore();

  // Cropper States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [copiedStudentId, setCopiedStudentId] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const handleCopyStudentId = useCallback(async () => {
    const sid = profile?.student_id;
    if (!sid) return;
    try {
      if (Capacitor.isNativePlatform()) {
        await Clipboard.write({ string: sid });
      } else {
        await navigator.clipboard.writeText(sid);
      }
      triggerHaptic('light');
      setCopiedStudentId(true);
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      copyResetTimerRef.current = window.setTimeout(() => setCopiedStudentId(false), 1800);
      showToast({
        variant: 'success',
        title: 'Student ID Copied',
        message: `${sid} copied to clipboard.`,
      });
    } catch {
      showToast({
        variant: 'error',
        title: 'Copy Failed',
        message: 'Could not copy Student ID automatically.',
      });
    }
  }, [profile?.student_id, showToast]);

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

  const handleHiddenDebugTap = () => {
      tapCountRef.current += 1;
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);

      if (tapCountRef.current >= 7) {
          toggleDebug();
          tapCountRef.current = 0;
      }
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

        // Update User Profile Metadata ONLY
        // Trigger will handle profiles table sync automatically
        const { error: updateUserError } = await supabase.auth.updateUser({
          data: { avatar_url: publicUrl },
        });

        if (updateUserError) throw updateUserError;

        await refreshUser();
        // Centralized refresh and invalidation (best-effort after successful avatar update)
        await refreshProfile().catch((err) => {
          console.warn('[ProfilePage] Failed to refresh profile after avatar upload:', err);
        });
        queryClient.invalidateQueries({ queryKey: ['community-search'] });
        queryClient.invalidateQueries({ queryKey: ['user-posts'] });
        queryClient.invalidateQueries({ queryKey: ['community-comments'] });
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });

        showToast({ title: 'Success', message: 'Profile picture updated successfully', variant: 'success' });

    } catch (err: any) {
        setError(`Upload failed: ${err.message}`);
    } finally {
        setUploading(false);
        setImageSrc(null); // Close the cropper modal always
    }
  };
  
  const displayAvatarUrl = getCanonicalAvatarUrl(profile, user);

  const { activeExamId, pinnedExamIds, togglePinExam, setActiveExam } = useExamContextStore();
  const [isTargetExamModalOpen, setIsTargetExamModalOpen] = useState(false);
  const { metadata } = useQuestionMetadata();

  const examCounts = useMemo(() => {
    if (metadata && metadata.length > 0) {
      return computeExamCounts(metadata);
    }
    try {
      const raw = localStorage.getItem('mindflow_exam_counts_cache_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // Graceful fallback
    }
    return {};
  }, [metadata]);

  const activeExamObj = useMemo(() => getCanonicalExamById(activeExamId), [activeExamId]);
  const targetExam = activeExamObj?.displayName || profile?.target_exam || user?.user_metadata?.target_exam || 'Not Set';
  const fullName = getUserDisplayName(profile, user, 'Student');

  const { stats: userStats, loading: statsLoading } = useProfileStats();

  const handleSetActiveTargetExam = async (examId: string) => {
    triggerHaptic('light');
    setActiveExam(examId, 'modal');
    const exam = CANONICAL_EXAMS.find((e) => e.id === examId);
    if (!exam) return;

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        data: { target_exam: exam.displayName },
      });
      if (updateErr) throw updateErr;

      await refreshUser();
      await refreshProfile().catch(() => {});
      showToast({
        variant: 'success',
        title: 'Target Exam Updated',
        message: `Preparing for ${exam.displayName}`,
      });
    } catch (err: any) {
      showToast({
        variant: 'error',
        title: 'Update Failed',
        message: err?.message || 'Could not update target exam.',
      });
    }
  };

  const handleSignOut = async () => {
    triggerHaptic('light');
    await signOut();
    if (onSignOut) {
      onSignOut();
    }
  };

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
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
          </div>
          <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                disabled={uploading}
                className="min-h-[44px] px-6 py-2 bg-slate-600 text-white font-bold rounded-lg shadow-md hover:bg-slate-700 transition-all active:scale-95 touch-manipulation flex items-center gap-2 cursor-pointer"
              >
                  <X className="w-5 h-5" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleAvatarUpload}
                disabled={uploading}
                className="min-h-[44px] px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95 touch-manipulation flex items-center gap-2 cursor-pointer"
                aria-label="Upload profile picture"
              >
                  {uploading ? <><Loader2 className="w-5 h-5 animate-spin"/> Cropping...</> : <> <CheckCircle className="w-5 h-5" /> Apply </>}
              </button>
          </div>
        </div>
      )}

      <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 pb-32 md:pb-20 scroll-mb-28 transition-colors duration-300 px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* --- Top Information Card --- */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-slate-900/50 overflow-hidden transition-colors duration-300">
            <div className="relative h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="p-6 pb-6 text-center relative">
              
              <div className="relative w-28 h-28 mx-auto -mt-20" onClick={handleHiddenDebugTap}>
                  <PresenceAvatar
                    userId={user?.id || ''}
                    avatarUrl={displayAvatarUrl}
                    altText="Profile"
                    className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-lg"
                  />
                  <input type="file" ref={avatarInputRef} className="hidden text-base" onChange={handleFileSelect} accept="image/png, image/jpeg" />
                  <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 min-w-[44px] min-h-[44px] w-11 h-11 bg-indigo-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-indigo-700 transition-all duration-300 shadow-md group active:scale-95 touch-manipulation cursor-pointer"
                      aria-label="Change profile picture"
                  >
                      <Pencil className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </button>
              </div>

              <div className="mt-4 flex flex-col items-center">
                  <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">{fullName}</h1>
                      <PresenceDot userId={user?.id || ''} />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">{user.email}</p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/70 pl-3 pr-1 py-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600/80 dark:text-indigo-300/80">
                          Student ID
                      </span>
                      <span
                          data-testid="profile-student-id"
                          className="font-mono text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-200 tracking-wide"
                      >
                          {profile?.student_id || 'Pending Sync'}
                      </span>
                      {profile?.student_id && (
                          <button
                              type="button"
                              onClick={handleCopyStudentId}
                              aria-label="Copy Unique Student ID"
                              data-testid="copy-student-id-btn"
                              className="min-h-[44px] min-w-[44px] -my-1 px-2.5 rounded-xl text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 inline-flex items-center justify-center transition-all active:scale-95 touch-manipulation cursor-pointer"
                          >
                              {copiedStudentId ? (
                                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                              ) : (
                                  <Copy className="w-4 h-4" aria-hidden="true" />
                              )}
                          </button>
                      )}
                  </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                      <Target className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      Preparing for: {targetExam}
                  </span>
                  <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setIsTargetExamModalOpen(true);
                      }}
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all active:scale-95 touch-manipulation cursor-pointer shadow-xs"
                  >
                      <span>Change Exam</span>
                  </button>
              </div>

              {error && (
                  <div className="mt-4 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4"/>
                      <span>{error}</span>
                  </div>
              )}

              <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="mt-5 w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 active:scale-95 touch-manipulation cursor-pointer"
              >
                  Edit Profile Info
              </button>
            </div>
          </div>

          {/* --- Performance Stats --- */}
          <button
            type="button"
            onClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)}
            className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.99] touch-manipulation scroll-mb-28"
          >
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                   <BarChart className="w-5 h-5 text-indigo-500" />
                   Performance
               </h2>
               <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:text-indigo-400 transition-colors" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-800/40">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400/70 font-bold uppercase tracking-wider mb-1">Accuracy</p>
                  {statsLoading ? (
                      <div className="h-7 w-16 bg-indigo-200 dark:bg-indigo-800/50 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">{userStats.averageScore}%</p>
                  )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Tests</p>
                  {statsLoading ? (
                      <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{userStats.quizzesCompleted.toLocaleString()}</p>
                  )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Correct</p>
                  {statsLoading ? (
                      <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{userStats.correctAnswers.toLocaleString()}</p>
                  )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Time Spent</p>
                  {statsLoading ? (
                      <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse mt-1"></div>
                  ) : (
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-slate-400" /> {userStats.totalTimeSpentFormatted || '0s'}
                      </p>
                  )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-1 mt-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 mr-1">Weak Topics:</span>
                      {statsLoading ? (
                          <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-xs border border-slate-100 dark:border-slate-700 animate-pulse">Loading...</span>
                      ) : userStats.weakTopics.length > 0 ? (
                          userStats.weakTopics.map(topic => (
                              <span key={topic} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs border border-red-100 truncate max-w-[150px]" title={topic}>
                                  {topic}
                              </span>
                          ))
                      ) : userStats.quizzesCompleted > 0 ? (
                          <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-xs border border-green-100 dark:border-green-900/50">Looking good!</span>
                      ) : (
                          <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-xs border border-slate-100 dark:border-slate-700">Needs more data</span>
                      )}
                 </p>
            </div>
          </button>

          {/* 3. My Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 transition-colors duration-300">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 px-2">My Activity</h2>
              <div className="space-y-2">
                  <button type="button" onClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=attempted`)} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400"><FileText className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Attempted Tests</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-colors" />
                  </button>
                  <button type="button" onClick={() => navigate(ROUTES.QUIZ.BOOKMARKS)} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-500"><Bookmark className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Saved Questions</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </button>
                  <button type="button" onClick={() => navigate(`${ROUTES.QUIZ.LIBRARY}?tab=created`)} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500 dark:text-blue-400"><Grid className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Created Quizzes</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </button>
              </div>
          </div>

          {/* 4. Settings & More */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 transition-colors duration-300">
              <div className="space-y-2">
                  <button type="button" onClick={() => navigate(ROUTES.PROFILE.SUBSCRIPTION)} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400"><CreditCard className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Subscription & Rewards</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 dark:text-emerald-400 transition-colors" />
                  </button>
                  <button type="button" onClick={() => navigate(ROUTES.PROFILE.PREFERENCES)} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400"><Settings2 className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">App Preferences</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-colors" />
                  </button>
                  <button type="button" onClick={onNavigateToSettings} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400"><Shield className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Settings & Security</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 dark:text-slate-400 transition-colors" />
                  </button>

                  {hasAdminPrivileges && (
                    <button type="button" onClick={() => navigate(ROUTES.ADMIN.OVERVIEW)} className="w-full min-h-[44px] flex items-center justify-between p-3.5 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all active:scale-95 touch-manipulation cursor-pointer group mt-2 border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/10 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-950 dark:text-indigo-200 block text-sm">Admin Command Center</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Staff</span>
                          </div>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 block font-medium">Control Room, IAM, Content & Mock CMS</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors" />
                    </button>
                  )}
                  <button type="button" onClick={() => navigate(ROUTES.PROFILE.SUPPORT)} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-sky-50 dark:bg-sky-900/20 rounded-lg flex items-center justify-center text-sky-500 dark:text-sky-400"><HelpCircle className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Help &amp; Support</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-500 transition-colors" />
                  </button>
                  <button type="button" onClick={() => navigate(ROUTES.ABOUT.PRIVACY_POLICY)} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400"><FileText className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Privacy Policy</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </button>
                  <button type="button" onClick={() => navigate(ROUTES.ABOUT.TERMS_OF_USE)} className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 touch-manipulation cursor-pointer group">
                      <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400"><FileText className="w-4 h-4" /></div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Terms of Use</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
              </div>
          </div>

          {/* 5. Logout */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800/50 hover:text-red-600 dark:hover:text-red-400 text-slate-600 dark:text-slate-400 font-bold transition-all duration-300 active:scale-95 touch-manipulation cursor-pointer scroll-mb-28"
          >
              <LogOut className="w-5 h-5" />
              Sign Out
          </button>

        </div>
      </div>

      <ManageTargetExamsModal
        isOpen={isTargetExamModalOpen}
        onClose={() => setIsTargetExamModalOpen(false)}
        pinnedExamIds={pinnedExamIds}
        activeExamId={activeExamId}
        examCounts={examCounts}
        onTogglePin={togglePinExam}
        onSetActive={handleSetActiveTargetExam}
      />
    </>
  );
};

export default ProfilePage;

