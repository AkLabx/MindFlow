import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { NativeDialog } from '@/components/ui/NativeDialog';
import { ROUTES } from '@/config/routes';
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
  Sun,
  Moon,
  ExternalLink,
  BarChart3,
  PlusCircle,
  CheckSquare,
  GraduationCap,
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
  subtitle?: string;
  category: string;
  keywords?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { isDarkMode, toggleDarkMode } = useSettingsStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const paletteId = useId();
  const listboxId = `${paletteId}-listbox`;

  const commands = useMemo<CommandItem[]>(() => [
    // Mock Tests & BPSC Quick Actions
    {
      id: 'quick-mock-tests-catalog',
      title: 'Jump to Mock Tests Catalog (Publish, Clone & Analytics)',
      subtitle: '/admin/test-series?tab=tests',
      category: 'Mock Tests',
      keywords: 'bpsc mock tests cms publish clone insights analytics catalog',
      icon: CheckSquare,
      action: () => { navigate(`${ROUTES.ADMIN.TEST_SERIES}?tab=tests`); onClose(); }
    },
    {
      id: 'quick-create-mock-test',
      title: 'Create New Mock Test (4-Step Builder)',
      subtitle: ROUTES.ADMIN.TEST_NEW,
      category: 'Mock Tests',
      keywords: 'new create mock test builder bpsc prelims studio',
      icon: PlusCircle,
      action: () => { navigate(ROUTES.ADMIN.TEST_NEW); onClose(); }
    },
    {
      id: 'quick-student-bpsc-preview',
      title: 'Student Preview: BPSC Prepared Mock Tests',
      subtitle: ROUTES.TEST_SERIES.BPSC,
      category: 'Student Preview',
      keywords: 'student preview bpsc mock tests live listing',
      icon: GraduationCap,
      action: () => { navigate(ROUTES.TEST_SERIES.BPSC); onClose(); }
    },
    // Navigation
    {
      id: 'nav-overview',
      title: 'Go to Admin Overview / Cockpit',
      subtitle: ROUTES.ADMIN.OVERVIEW,
      category: 'Navigation',
      keywords: 'home dashboard cockpit summary metrics',
      icon: LayoutDashboard,
      action: () => { navigate(ROUTES.ADMIN.OVERVIEW); onClose(); }
    },
    {
      id: 'nav-analytics',
      title: 'Live Telemetry & Platform Analytics',
      subtitle: ROUTES.ADMIN.ANALYTICS,
      category: 'Navigation',
      keywords: 'telemetry metrics charts events analytics',
      icon: BarChart3,
      action: () => { navigate(ROUTES.ADMIN.ANALYTICS); onClose(); }
    },
    {
      id: 'nav-users',
      title: 'User Directory & Permissions (IAM)',
      subtitle: ROUTES.ADMIN.USERS,
      category: 'Navigation',
      keywords: 'users roles rbac iam permissions accounts',
      icon: Users,
      action: () => { navigate(ROUTES.ADMIN.USERS); onClose(); }
    },
    {
      id: 'nav-questions',
      title: 'Question Bank (Master Repository)',
      subtitle: ROUTES.ADMIN.QUESTIONS,
      category: 'Navigation',
      keywords: 'questions bank mcq edit bpsc ssc',
      icon: HelpCircle,
      action: () => { navigate(ROUTES.ADMIN.QUESTIONS); onClose(); }
    },
    {
      id: 'nav-vocab',
      title: 'Vocabulary Matrix (OWS, Idioms, Synonyms)',
      subtitle: ROUTES.ADMIN.VOCAB,
      category: 'Navigation',
      keywords: 'vocabulary ows idioms synonyms english',
      icon: Languages,
      action: () => { navigate(ROUTES.ADMIN.VOCAB); onClose(); }
    },
    {
      id: 'nav-ai-pipeline',
      title: 'AI Enrichment Engine & DLQ Inspector',
      subtitle: ROUTES.ADMIN.ENRICHMENT,
      category: 'Navigation',
      keywords: 'ai pipeline enrichment dlq pgmq workers',
      icon: Activity,
      action: () => { navigate(ROUTES.ADMIN.ENRICHMENT); onClose(); }
    },
    {
      id: 'nav-content-studio',
      title: 'Content Studio & Ingestion Plane',
      subtitle: ROUTES.ADMIN.CONTENT,
      category: 'Navigation',
      keywords: 'content studio ingestion pdf upload extract',
      icon: Sparkles,
      action: () => { navigate(ROUTES.ADMIN.CONTENT); onClose(); }
    },
    {
      id: 'nav-test-series',
      title: 'Mock Tests & Exam Series CMS',
      subtitle: ROUTES.ADMIN.TEST_SERIES,
      category: 'Mock Tests',
      keywords: 'categories series exams cms',
      icon: Award,
      action: () => { navigate(ROUTES.ADMIN.TEST_SERIES); onClose(); }
    },
    {
      id: 'nav-materials',
      title: 'Study Materials & PDF Manager',
      subtitle: ROUTES.ADMIN.MATERIALS,
      category: 'Navigation',
      keywords: 'study materials pdf notes',
      icon: FileText,
      action: () => { navigate(ROUTES.ADMIN.MATERIALS); onClose(); }
    },
    {
      id: 'nav-reports',
      title: 'Community Moderation Queue',
      subtitle: ROUTES.ADMIN.REPORTS,
      category: 'Navigation',
      keywords: 'moderation reports flags community',
      icon: ShieldAlert,
      action: () => { navigate(ROUTES.ADMIN.REPORTS); onClose(); }
    },
    {
      id: 'nav-notifications',
      title: 'Broadcast Notification Center',
      subtitle: ROUTES.ADMIN.NOTIFICATIONS,
      category: 'Navigation',
      keywords: 'notifications push broadcast alerts',
      icon: Megaphone,
      action: () => { navigate(ROUTES.ADMIN.NOTIFICATIONS); onClose(); }
    },
    {
      id: 'nav-app-config',
      title: 'Remote App Config & Intro Engine',
      subtitle: ROUTES.ADMIN.APP_CONFIG,
      category: 'Navigation',
      keywords: 'remote config branding theme intro splash',
      icon: Sliders,
      action: () => { navigate(ROUTES.ADMIN.APP_CONFIG); onClose(); }
    },
    {
      id: 'nav-financials',
      title: 'Financials & Monetization Ledger',
      subtitle: ROUTES.ADMIN.FINANCIALS,
      category: 'Navigation',
      keywords: 'financials revenue billing subscriptions ledger',
      icon: CreditCard,
      action: () => { navigate(ROUTES.ADMIN.FINANCIALS); onClose(); }
    },
    // Quick Actions
    {
      id: 'action-toggle-theme',
      title: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle admin workspace color theme',
      category: 'Actions',
      keywords: 'theme dark light appearance mode',
      icon: isDarkMode ? Sun : Moon,
      action: () => { toggleDarkMode(); onClose(); }
    },
    {
      id: 'action-return-app',
      title: 'Exit Admin & Return to Student App',
      subtitle: ROUTES.DASHBOARD,
      category: 'Actions',
      keywords: 'exit student dashboard home',
      icon: ExternalLink,
      action: () => { navigate(ROUTES.DASHBOARD); onClose(); }
    }
  ], [isDarkMode, navigate, onClose, toggleDarkMode]);

  const filteredCommands = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return commands;
    return commands.filter((cmd) => {
      const haystack = `${cmd.title} ${cmd.category} ${cmd.subtitle || ''} ${cmd.keywords || ''}`.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [commands, query]);

  // Reset search query and highlight index cleanly every time palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keep active command item scrolled into view for keyboard navigation
  useEffect(() => {
    if (!isOpen || filteredCommands.length === 0) return;
    const activeEl = optionRefs.current[selectedIndex];
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, selectedIndex, filteredCommands.length]);

  const activeOptionId =
    filteredCommands.length > 0 && filteredCommands[selectedIndex]
      ? `${listboxId}-opt-${filteredCommands[selectedIndex].id}`
      : undefined;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCommands.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSelectedIndex(filteredCommands.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filteredCommands[selectedIndex]?.action();
    }
  };

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      variant="command"
      ariaLabel="Admin command palette"
      initialFocusRef={searchInputRef}
      className="max-w-xl"
      panelClassName="relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
    >
      {/* Search Input Bar */}
      <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-2">
        <Search className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
        <input
          id={`${paletteId}-input`}
          ref={searchInputRef}
          type="text"
          role="combobox"
          aria-label="Search admin commands and pages"
          aria-expanded={filteredCommands.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Type a command or jump to screen... (ESC to close)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          className="w-full min-h-[44px] bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close command palette"
          className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shrink-0"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Results List */}
      <div
        id={listboxId}
        role="listbox"
        aria-label="Available admin commands"
        className="max-h-80 overflow-y-auto p-2 space-y-1 scrollbar-thin"
      >
        {filteredCommands.length === 0 ? (
          <div className="py-8 px-4 text-center text-sm text-slate-500 dark:text-slate-400">
            No matching commands found for &quot;{query}&quot;.
          </div>
        ) : (
          filteredCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            const optionId = `${listboxId}-opt-${cmd.id}`;
            return (
              <button
                key={cmd.id}
                id={optionId}
                ref={(el) => {
                  optionRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full min-h-[44px] flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon
                    aria-hidden="true"
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{cmd.title}</span>
                    {cmd.subtitle && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-normal">
                        {cmd.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider shrink-0">
                  {cmd.category}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Navigation Tip */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="truncate">
          Use <kbd className="font-semibold text-slate-700 dark:text-slate-300">↑</kbd>{' '}
          <kbd className="font-semibold text-slate-700 dark:text-slate-300">↓</kbd> to navigate,{' '}
          <kbd className="font-semibold text-slate-700 dark:text-slate-300">Enter</kbd> to select
        </span>
        <span className="shrink-0">MindFlow Admin OS</span>
      </div>
    </NativeDialog>
  );
};
