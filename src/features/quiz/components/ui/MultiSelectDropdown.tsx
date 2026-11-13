import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useState, useRef, useEffect, useMemo, useId, KeyboardEvent } from 'react';
import { ChevronDown, Check, X, Search, Info } from 'lucide-react';
import { cn } from '../../../../utils/cn';

/**
 * A custom multi-select dropdown component with search, filtering, and count display.
 */

// Simple debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const MultiSelectDropdown = React.memo(function MultiSelectDropdown({
  label,
  options, 
  selectedOptions, 
  onSelectionChange,
  placeholder = 'Select Options',
  disabled = false,
  counts,
  hideZeroCount = false,
  tooltip
}: { 
  label?: string;
  options: string[]; 
  selectedOptions: string[]; 
  onSelectionChange: (selected: string[]) => void; 
  placeholder?: string;
  disabled?: boolean;
  counts?: { [key: string]: number };
  hideZeroCount?: boolean;
  tooltip?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const tooltipId = useId();
  const supportsPopover =
    typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tooltipTriggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTooltipOpen || supportsPopover) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !tooltipTriggerRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        setIsTooltipOpen(false);
      }
    };
    const handleEsc = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTooltipOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isTooltipOpen, supportsPopover]);

  const handleTooltipToggle = (event: React.ToggleEvent<HTMLDivElement>) => {
    const opening = event.newState === 'open';
    setIsTooltipOpen(opening);
    if (!opening || !tooltipTriggerRef.current) return;

    const triggerRect = tooltipTriggerRef.current.getBoundingClientRect();
    const padding = 16;
    const maxWidth = 224;
    const halfWidth = Math.min(maxWidth, Math.max(0, window.innerWidth - padding * 2)) / 2;
    const centerX = triggerRect.left + triggerRect.width / 2;
    const clampedLeft = Math.max(
      padding + halfWidth,
      Math.min(centerX, window.innerWidth - padding - halfWidth)
    );
    const placeBelow = triggerRect.top < 110;

    setTooltipStyle({
      position: 'fixed',
      inset: 'auto',
      margin: 0,
      left: `${clampedLeft}px`,
      transform: 'translateX(-50%)',
      ...(placeBelow
        ? { top: `${triggerRect.bottom + 8}px` }
        : { bottom: `${window.innerHeight - triggerRect.top + 8}px` }),
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input
      setTimeout(() => {
          searchInputRef.current?.focus();
      }, 50);

      // Check collision with bottom of window
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 320 && rect.top > 320) { // 320px is max-h-80 (320px) roughly
          setMenuPosition('top');
        } else {
          setMenuPosition('bottom');
        }
      }
    } else {
        setSearchTerm('');
        setFocusedIndex(-1);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  const filteredOptions = useMemo(() => {
      let result = options;

      if (hideZeroCount && counts) {
          result = result.filter(opt => {
              const isSelected = selectedOptions.includes(opt);
              return isSelected || (counts[opt] || 0) > 0;
          });
      }
      if (debouncedSearchTerm) {
          result = result.filter(opt => opt.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      }

      const sorted = [...result].sort((a, b) => {
          // Always bring selected items to the top
          const isSelectedA = selectedOptions.includes(a);
          const isSelectedB = selectedOptions.includes(b);
          if (isSelectedA && !isSelectedB) return -1;
          if (!isSelectedA && isSelectedB) return 1;

          const countA = counts?.[a] || 0;
          const countB = counts?.[b] || 0;

          if (countA > 0 && countB === 0) return -1;
          if (countA === 0 && countB > 0) return 1;
          return a.localeCompare(b);
      });

      // Limit unselected displayed tags to avoid DOM/array manipulation bloat
      // when virtualizing, we still don't want an array of 30,000 strings if not needed
      // But we MUST show all selected options
      const maxResults = 300;
      if (sorted.length > maxResults) {
         // Keep all selected, plus up to maxResults total
         const unselected = sorted.filter(opt => !selectedOptions.includes(opt));
         const limitedUnselected = unselected.slice(0, Math.max(0, maxResults - selectedOptions.length));
         return [...sorted.filter(opt => selectedOptions.includes(opt)), ...limitedUnselected];
      }
      return sorted;
  }, [options, debouncedSearchTerm, counts, selectedOptions, hideZeroCount]);

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Height of each row in px roughly
    overscan: 5,
  });


  const handleOptionToggle = (option: string) => {
    const newSelection = selectedOptions.includes(option)
      ? selectedOptions.filter(item => item !== option)
      : [...selectedOptions, option];
    onSelectionChange(newSelection);
  };

  const clearSelection = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectionChange([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        const option = filteredOptions[focusedIndex];
        const isSelected = selectedOptions.includes(option);
        const count = counts?.[option] || 0;
        if (isSelected || count > 0) {
          handleOptionToggle(option);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Scroll focused item into view via virtualizer
  useEffect(() => {
    if (focusedIndex >= 0) {
      virtualizer.scrollToIndex(focusedIndex, { align: 'auto' });
    }
  }, [focusedIndex, virtualizer]);


  return (
    <div className={cn("relative pb-5 border-b-2 border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0", isOpen && "z-50")} ref={dropdownRef}>
      {label && (
        <div className="flex items-center gap-2 mb-3 w-full">
          <label className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white dark:bg-blue-500 text-xs font-bold uppercase tracking-wider rounded-md shadow-sm">{label}</label>
          {tooltip && (
            <div className="relative flex items-center">
              <button
                ref={tooltipTriggerRef}
                type="button"
                popoverTarget={supportsPopover ? tooltipId : undefined}
                popoverTargetAction={supportsPopover ? 'toggle' : undefined}
                onClick={!supportsPopover ? () => setIsTooltipOpen((prev) => !prev) : undefined}
                aria-expanded={isTooltipOpen}
                aria-label={label ? `More about ${label}` : 'More information'}
                className="-my-3.5 -mx-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Info className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {supportsPopover ? (
                <div
                  ref={tooltipRef}
                  id={tooltipId}
                  popover="auto"
                  role="tooltip"
                  onToggle={handleTooltipToggle}
                  style={tooltipStyle}
                  className="w-56 max-w-[calc(100vw-2rem)] p-2.5 bg-gray-800 text-white text-xs rounded-lg shadow-lg text-center font-normal leading-relaxed border border-gray-700/60"
                >
                  {tooltip}
                </div>
              ) : isTooltipOpen ? (
                <div
                  ref={tooltipRef}
                  id={tooltipId}
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 text-center font-normal leading-relaxed"
                >
                  {tooltip}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              ) : null}
            </div>
          )}
          {options.length > 0 && (
            <div className="ml-auto flex items-center gap-1.5">
              <input
                type="checkbox"
                id={`select-all-${label?.replace(/\s+/g, '-')}`}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer text-base"
                checked={
                  options.length > 0 &&
                  options.filter(opt => (counts?.[opt] || 0) > 0).length > 0 &&
                  options.filter(opt => (counts?.[opt] || 0) > 0).every(opt => selectedOptions.includes(opt))
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    const availableOptions = options.filter(opt => (counts?.[opt] || 0) > 0);
                    onSelectionChange(availableOptions);
                  } else {
                    onSelectionChange([]);
                  }
                }}
              />
              <label
                htmlFor={`select-all-${label?.replace(/\s+/g, '-')}`}
                className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors"
              >
                All
              </label>
            </div>
          )}
        </div>
      )}
      
      <div className="relative flex items-center w-full">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            "w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border rounded-lg text-sm transition-all text-left",
            selectedOptions.length > 0 && !disabled ? "pr-14" : "",
            disabled ? "bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700" : "hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 cursor-pointer border-gray-300 dark:border-gray-600",
            isOpen ? "border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/50" : ""
          )}
        >
          <span className={cn("truncate", selectedOptions.length === 0 ? "text-gray-400" : "text-gray-900 dark:text-white font-medium")}>
            {selectedOptions.length === 0 ? placeholder : selectedOptions.length === 1 ? selectedOptions[0] : `${selectedOptions.length} selected`}
          </span>
          <ChevronDown aria-hidden="true" className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform", isOpen ? "rotate-180" : "")} />
        </button>

        {selectedOptions.length > 0 && !disabled && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Clear selection"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={cn(
          "absolute z-[60] w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-80",
          menuPosition === 'top' ? "bottom-full mb-2" : "top-full mt-2"
        )}>
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setFocusedIndex(-1);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
                      onClick={(e) => e.stopPropagation()}
                  />
              </div>
          </div>

          {/* Options List */}
          <div className="flex-1 p-1 flex flex-col min-h-0">
              {filteredOptions.length === 0 ? (
                 <div className="p-4 text-sm text-gray-400 text-center italic">
                    {options.length === 0 ? "No options available" : (hideZeroCount && Object.values(counts || {}).every(c => c === 0) ? `No ${label?.toLowerCase() || 'options'} available` : "No matches found")}
                 </div>
              ) : (

                <div
                    ref={parentRef}
                    className="w-full flex-1 min-h-0 overflow-y-auto"
                >
                  <ul
                      ref={listRef}
                      role="listbox"
                      aria-multiselectable="true"
                      style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
                  >
                      {virtualizer.getVirtualItems().map((virtualItem) => {
                      const index = virtualItem.index;
                      const option = filteredOptions[index];
                      const count = counts?.[option] || 0;
                      const isSelected = selectedOptions.includes(option);
                      const isOptionDisabled = !isSelected && count === 0;
                      const isFocused = index === focusedIndex;

                      return (
                          <li
                              key={virtualItem.key}
                              role="option"
                              aria-selected={isSelected}
                              data-index={index}
                              ref={virtualizer.measureElement}
                              style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  transform: `translateY(${virtualItem.start}px)`
                              }}
                          >
                          <button
                              type="button"
                              onClick={() => !isOptionDisabled && handleOptionToggle(option)}
                              disabled={isOptionDisabled}
                              className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                                  isSelected ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700",
                                  isFocused && !isSelected && "bg-gray-100 dark:bg-gray-700",
                                  isFocused && isSelected && "ring-2 ring-indigo-500 inset-0 z-10",
                                  isOptionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
                              )}
                          >
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                                      isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
                                      isOptionDisabled && "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                  )}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="truncate">{option}</span>
                              </div>
                              <span className={cn("text-xs ml-2 flex-shrink-0", isSelected ? "text-indigo-500 dark:text-indigo-400" : "text-gray-400")}>
                                  ({count})
                              </span>
                          </button>
                          </li>
                      );
                      })}
                  </ul>
                </div>

              )}
          </div>
        </div>
      )}
    </div>
  );
});
