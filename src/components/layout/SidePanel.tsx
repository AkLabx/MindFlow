import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, LogIn, Home, LayoutDashboard, Languages,
    Wrench, Download, Info, GraduationCap, FileText, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    onTabChange: (tab: string) => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, onTabChange }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleNavigation = (path: string, tab?: string) => {
        onClose();
        if (path === 'DOWNLOAD_LINK') {
                window.open('https://drive.google.com/drive/folders/1Owy8_qnvMOTw5WLRGLQajCiScN-dOHtF', '_blank');
            } else if (path === 'HOME_LINK') {
                window.open('https://aklabx.github.io/MindFlow', '_self');
            } else {
                if (tab) onTabChange(tab);
                navigate(path);
            }

    };

    // --- Animation Variants ---

    // 1. Overlay (Fade in with backdrop blur)
    const overlayVariants = {
        hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
        visible: {
            opacity: 1,
            backdropFilter: 'blur(8px)',
            transition: { duration: 0.3 }
        },
        exit: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transition: { duration: 0.3, delay: 0.2 }
        }
    };

    // 2. Panel Base (Slide in from right)
    const panelVariants = {
        hidden: { x: '100%' },
        visible: {
            x: 0,
            transition: {
                type: 'spring' as const,
                damping: 20,
                stiffness: 300,
                duration: 0.2
            }
        },
        exit: {
            x: '100%',
            transition: {
                type: 'spring' as const,
                damping: 20, stiffness: 300, duration: 0.2
            }
        }
    };




    const menuItems = [
        { icon: Home, label: 'Home', path: 'HOME_LINK' },
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', tab: 'home' },
        { icon: Languages, label: 'English Zone', path: '/english', tab: 'home' },
        { icon: Wrench, label: 'Tools', path: '/tools', tab: 'home' },
        { icon: Download, label: 'Download', path: 'DOWNLOAD_LINK' },
        { icon: Info, label: 'About Us', path: '/about', tab: 'home' },
        { icon: GraduationCap, label: 'School Mode', path: '/school', tab: 'school' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-slate-900/40 dark:bg-slate-900/60"
                        aria-hidden="true"
                    />

                    {/* Side Panel Container */}
                    <motion.div
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed top-0 right-0 h-[100dvh] w-4/5 max-w-sm z-[70] bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border-l border-white/20 dark:border-white/10"
                    >
                        {/* Inner Glassmorphism Layer */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white/80 dark:from-slate-800/50 dark:to-slate-900/80 backdrop-blur-3xl -z-10" />

                        <div className="flex flex-col h-full w-full relative">
                            {/* --- Top: Header & Profile --- */}
                            <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="mt-8">
                                    {user ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 p-1 shadow-inner border border-white dark:border-slate-700">
                                                <img
                                                    src={user.user_metadata?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=\${user.user_metadata?.full_name || user.email}`}
                                                    alt="User Avatar"
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                                    {user.user_metadata?.full_name || 'MindFlow User'}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {user.email}
                                                </p>
                                                <button
                                                    onClick={() => handleNavigation('/profile', 'profile')}
                                                    className="mt-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start gap-3">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-800/30 flex items-center justify-center border border-white dark:border-slate-700">
                                                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Guest User</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sign in to sync your progress</p>
                                                <button
                                                    onClick={() => handleNavigation('/login', 'login')}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                                                >
                                                    <LogIn className="w-4 h-4" />
                                                    Sign In / Up
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- Middle: Navigation Links (Staggered) --- */}
                            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                                {menuItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleNavigation(item.path, item.tab)}
                                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                                    >
                                        <div className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-sm transition-all">
                                            <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                            {item.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* --- Bottom: Branding & Legal --- */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/20">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-indigo-600 p-1.5 rounded-xl shadow-inner border border-indigo-500">
                                        <img src="./mindflow-icon.svg" alt="MindFlow Logo" className="w-6 h-6" onError={(e) => {
                                            // Fallback to text icon if SVG fails to load
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4 4.5 4.5 0 0 1-3-4"/></svg>';
                                        }} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white tracking-tight">MindFlow</h4>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">© {new Date().getFullYear()} All rights reserved</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-semibold">
                                    <button
                                        onClick={() => handleNavigation('/privacy-policy')}
                                        className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        Privacy Policy
                                    </button>
                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                    <button
                                        onClick={() => handleNavigation('/about/terms-of-use')}
                                        className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        Terms of Use
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
