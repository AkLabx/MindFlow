import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Users,
  HelpCircle,
  Languages,
  Sparkles,
  FileText,
  Award,
  Activity,
  Sliders,
  CreditCard,
  ShieldAlert,
  Megaphone,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  X
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { isDarkMode, toggleDarkMode } = useSettingsStore();

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-overview',
      title: 'Go to Admin Overview / Cockpit',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => { navigate('/admin/overview'); onClose(); }
    },
    {
      id: 'nav-users',
      title: 'User Directory & Permissions (IAM)',
      category: 'Navigation',
      icon: Users,
      action: () => { navigate('/admin/users'); onClose(); }
    },
    {
      id: 'nav-questions',
      title: 'Question Bank (Master Repository)',
      category: 'Navigation',
      icon: HelpCircle,
      action: () => { navigate('/admin/questions'); onClose(); }
    },
    {
      id: 'nav-vocab',
      title: 'Vocabulary Matrix (OWS, Idioms, Synonyms)',
      category: 'Navigation',
      icon: Languages,
      action: () => { navigate('/admin/vocab'); onClose(); }
    },
    {
      id: 'nav-ai-pipeline',
      title: 'AI Enrichment Engine & DLQ Inspector',
      category: 'Navigation',
      icon: Activity,
      action: () => { navigate('/admin/enrichment'); onClose(); }
    },
    {
      id: 'nav-content-studio',
      title: 'Content Studio & Ingestion Plane',
      category: 'Navigation',
      icon: Sparkles,
      action: () => { navigate('/admin/content'); onClose(); }
    },
    {
      id: 'nav-test-series',
      title: 'Mock Tests & Exam Series CMS',
      category: 'Navigation',
      icon: Award,
      action: () => { navigate('/admin/test-series'); onClose(); }
    },
    {
      id: 'nav-materials',
      title: 'Study Materials & PDF Manager',
      category: 'Navigation',
      icon: FileText,
      action: () => { navigate('/admin/materials'); onClose(); }
    },
    {
      id: 'nav-reports',
      title: 'Community Moderation Queue',
      category: 'Navigation',
      icon: ShieldAlert,
      action: () => { navigate('/admin/reports'); onClose(); }
    },
    {
      id: 'nav-notifications',
      title: 'Broadcast Notification Center',
      category: 'Navigation',
      icon: Megaphone,
      action: () => { navigate('/admin/notifications'); onClose(); }
    },
    {
      id: 'nav-app-config',
      title: 'Remote App Config & Intro Engine',
      category: 'Navigation',
      icon: Sliders,
      action: () => { navigate('/admin/app-config'); onClose(); }
    },
    {
      id: 'nav-financials',
      title: 'Financials & Monetization Ledger',
      category: 'Navigation',
      icon: CreditCard,
      action: () => { navigate('/admin/financials'); onClose(); }
    },
    // Quick Actions
    {
      id: 'action-toggle-theme',
      title: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      category: 'Actions',
      icon: isDarkMode ? Sun : Moon,
      action: () => { toggleDarkMode(); onClose(); }
    },
    {
      id: 'action-return-app',
      title: 'Exit Admin & Return to Student App',
      category: 'Actions',
      icon: ExternalLink,
      action: () => { navigate('/dashboard'); onClose(); }
    }
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
          />

          {/* Dialog Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or jump to screen... (ESC to close)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {filteredCommands.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No matching commands found for &quot;{query}&quot;.
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{cmd.title}</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium uppercase tracking-wider shrink-0">
                        {cmd.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Tip */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>Use <kbd className="font-semibold text-slate-700 dark:text-slate-300">↑</kbd> <kbd className="font-semibold text-slate-700 dark:text-slate-300">↓</kbd> to navigate, <kbd className="font-semibold text-slate-700 dark:text-slate-300">Enter</kbd> to select</span>
              <span>MindFlow Admin OS</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
