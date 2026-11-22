import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchableFilterComboboxProps {
    label: string;
    ariaLabel: string;
    options: string[];
    value?: string;
    onChange: (value: string | undefined) => void;
    disabled?: boolean;
    placeholder?: string;
    maxVisible?: number;
}

export const SearchableFilterCombobox: React.FC<SearchableFilterComboboxProps> = ({
    label,
    ariaLabel,
    options,
    value,
    onChange,
    disabled = false,
    placeholder,
    maxVisible = 50,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    const listboxId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const closePanel = (restoreFocus = false) => {
        setIsOpen(false);
        setQuery('');
        if (restoreFocus) {
            triggerRef.current?.focus();
        }
    };

    const handleSelect = (nextValue: string | undefined) => {
        onChange(nextValue);
        closePanel(true);
    };

    useEffect(() => {
        if (!isOpen) return;

        searchInputRef.current?.focus();

        const handlePointerDown = (event: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                closePanel(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closePanel(true);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (disabled && isOpen) {
            closePanel(false);
        }
    }, [disabled, isOpen]);

    const { filtered, visibleOptions } = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const matches = normalizedQuery
            ? options.filter(opt => opt.toLowerCase().includes(normalizedQuery))
            : options;

        return {
            filtered: matches,
            visibleOptions: matches.slice(0, maxVisible),
        };
    }, [options, query, maxVisible]);

    return (
        <div ref={containerRef} className="relative inline-block">
            <button
                type="button"
                ref={triggerRef}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                disabled={disabled}
                onClick={() => {
                    if (isOpen) {
                        closePanel(false);
                    } else {
                        setIsOpen(true);
                    }
                }}
                className={`min-h-[44px] max-w-[220px] inline-flex items-center justify-between gap-2 px-3 py-1.5 text-sm rounded-lg border transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
                    value
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-200 font-medium'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                }`}
            >
                <span className="truncate">{value || label}</span>
                <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative flex items-center">
                            <Search
                                className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
                                aria-hidden="true"
                            />
                            <input
                                ref={searchInputRef}
                                type="search"
                                aria-label={`Search ${label}`}
                                placeholder={placeholder || `Search ${label.toLowerCase()}...`}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full min-h-[44px] pl-9 pr-11 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {query && (
                                <button
                                    type="button"
                                    aria-label={`Clear ${label} search`}
                                    onClick={() => {
                                        setQuery('');
                                        searchInputRef.current?.focus();
                                    }}
                                    className="absolute right-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-95 transition-transform"
                                >
                                    <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div
                        id={listboxId}
                        role="listbox"
                        aria-label={label}
                        className="max-h-64 overflow-y-auto p-1"
                    >
                        <button
                            type="button"
                            role="option"
                            aria-selected={!value}
                            onClick={() => handleSelect(undefined)}
                            className={`w-full min-h-[44px] px-3 py-2 text-left text-sm rounded-lg flex items-center justify-between gap-2 transition-colors active:scale-[0.99] ${
                                !value
                                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 font-medium'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <span className="truncate">{`All ${label}s`}</span>
                            {!value && <Check className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />}
                        </button>

                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                {`No matching ${label.toLowerCase()}s`}
                            </div>
                        ) : (
                            visibleOptions.map(opt => {
                                const isSelected = opt === value;
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(opt)}
                                        className={`w-full min-h-[44px] px-3 py-2 text-left text-sm rounded-lg flex items-center justify-between gap-2 transition-colors active:scale-[0.99] ${
                                            isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 font-medium'
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="truncate">{opt}</span>
                                        {isSelected && (
                                            <Check
                                                className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {filtered.length > maxVisible && (
                        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
                            {`Showing ${maxVisible} of ${filtered.length} matches — type to narrow results`}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
