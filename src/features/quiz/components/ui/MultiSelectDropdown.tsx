import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, Search, Info } from 'lucide-react';
import { cn } from '../../../../utils/cn';

/**
 * A custom multi-select dropdown component with search, filtering, and count display.
 *
 * Features:
 * - Searchable options.
 * - Displays active selection count.
 * - Shows item counts (number of available questions) for each option.
 * - Disables options with zero count.
 * - Tooltip support.
 *
 * @param {object} props - The component props.
 * @param {string} [props.label] - Optional label above the dropdown.
 * @param {string[]} props.options - List of all available options.
 * @param {string[]} props.selectedOptions - List of currently selected values.
 * @param {function} props.onSelectionChange - Callback when selection changes.
 * @param {string} [props.placeholder='Select Options'] - Placeholder text.
 * @param {boolean} [props.disabled=false] - Whether the dropdown is disabled.
 * @param {{ [key: string]: number }} [props.counts] - Map of option values to their available counts.
 * @param {string} [props.tooltip] - Optional tooltip text for the label.
 */
export function MultiSelectDropdown({ 
  label,
  options, 
  selectedOptions, 
  onSelectionChange,
  placeholder = 'Select Options',
  disabled = false,
  counts,
  tooltip
}: { 
  label?: string;
  options: string[]; 
  selectedOptions: string[]; 
  onSelectionChange: (selected: string[]) => void; 
  placeholder?: string;
  disabled?: boolean;
  counts?: { [key: string]: number };
  tooltip?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input for better UX
      setTimeout(() => {
          searchInputRef.current?.focus();
      }, 50);
    } else {
        setSearchTerm(''); // Reset search when closed
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
      if (!searchTerm) return options;
      return options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

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

  const getDisplayText = () => {
      if (selectedOptions.length === 0) return placeholder;
      if (selectedOptions.length === 1) return selectedOptions[0];
      return `${selectedOptions.length} selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
          {tooltip && (
            <div className="group relative flex items-center">
              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-indigo-500 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 pointer-events-none text-center font-normal leading-relaxed">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          )}
        </div>
      )}
      
      <button 
        onClick={() => !disabled && setIsOpen(!isOpen)} 
        disabled={disabled}
        className={cn(
            "w-full flex items-center justify-between p-3 bg-white border rounded-lg text-sm transition-all",
            disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200" : "hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 cursor-pointer border-gray-300",
            isOpen ? "border-indigo-500 ring-2 ring-indigo-100" : ""
        )}
      >
        <span className={cn("truncate", selectedOptions.length === 0 ? "text-gray-400" : "text-gray-900 font-medium")}>
            {getDisplayText()}
        </span>
        
        <div className="flex items-center gap-1">
            {selectedOptions.length > 0 && !disabled && (
                <div 
                    onClick={clearSelection}
                    className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 mr-1 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </div>
            )}
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen ? "rotate-180" : "")} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-80">
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 bg-white placeholder:text-gray-400"
                      onClick={(e) => e.stopPropagation()}
                  />
              </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 p-1">
              {filteredOptions.length === 0 ? (
                 <div className="p-4 text-sm text-gray-400 text-center italic">
                    {options.length === 0 ? "No options available" : "No matches found"}
                 </div>
              ) : (
                <ul>
                    {filteredOptions.map(option => {
                    const count = counts?.[option] || 0;
                    const isSelected = selectedOptions.includes(option);
                    // Disable if count is 0 AND it's not currently selected (so you can deselect it if data changed)
                    const isOptionDisabled = !isSelected && count === 0;

                    return (
                        <li key={option}>
                        <button 
                            onClick={() => !isOptionDisabled && handleOptionToggle(option)} 
                            disabled={isOptionDisabled}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors rounded-md",
                                isSelected ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50",
                                isOptionDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                            )}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                                    isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white",
                                    isOptionDisabled && "bg-gray-100 border-gray-200"
                                )}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <span className="truncate">{option}</span>
                            </div>
                            <span className={cn("text-xs ml-2 flex-shrink-0", isSelected ? "text-indigo-500" : "text-gray-400")}>
                                ({count})
                            </span>
                        </button>
                        </li>
                    );
                    })}
                </ul>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
