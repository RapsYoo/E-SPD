import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

/**
 * Komponen Dropdown Search (Combobox) yang mendukung:
 * - Pencarian instan berdasarkan label maupun sublabel
 * - Navigasi keyboard (ArrowUp, ArrowDown, Enter, Escape)
 * - Input kustom ("Gunakan: ...") apabila nilai tidak ada di daftar referensi
 * - Validasi form HTML5 native (`required`)
 */
export default function SearchableSelect({
  value = '',
  onChange,
  options = [],
  placeholder = 'Pilih atau cari...',
  searchPlaceholder = 'Ketik untuk mencari...',
  emptyText = 'Data tidak ditemukan',
  required = false,
  disabled = false,
  allowCustom = true,
  variant = 'default', // 'default' | 'amber'
  name = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'string'
        ? { value: opt, label: opt, sublabel: '' }
        : {
            value: opt.value,
            label: opt.label ?? opt.value,
            sublabel: opt.sublabel ?? '',
            meta: opt,
          }
    );
  }, [options]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (
      normalizedOptions.find((opt) => opt.value === value) || {
        value,
        label: value,
        sublabel: '',
      }
    );
  }, [normalizedOptions, value]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions.slice(0, 100);
    return normalizedOptions
      .filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          opt.value.toLowerCase().includes(q) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
      )
      .slice(0, 100);
  }, [normalizedOptions, searchQuery]);

  const hasExactMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return normalizedOptions.some(
      (opt) => opt.label.toLowerCase() === q || opt.value.toLowerCase() === q
    );
  }, [normalizedOptions, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, isOpen]);

  const handleSelect = (opt) => {
    onChange(opt.value, opt.meta || opt);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalItems =
      filteredOptions.length + (allowCustom && searchQuery.trim() && !hasExactMatch ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (totalItems > 0 ? (prev + 1) % totalItems : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        totalItems > 0 ? (prev - 1 + totalItems) % totalItems : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (allowCustom && searchQuery.trim()) {
        const customVal = searchQuery.trim();
        handleSelect({ value: customVal, label: customVal });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const triggerBaseClass =
    variant === 'amber'
      ? 'border-amber-300 bg-amber-50 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200'
      : 'border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100';

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      {/* Input tersembunyi untuk mendukung validasi HTML5 `required` */}
      {required && (
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={() => {}}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          placeholder={placeholder}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}

      <div
        role="combobox"
        aria-expanded={isOpen}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`flex min-h-[34px] w-full items-center justify-between gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition ${triggerBaseClass} ${
          disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500 opacity-75' : 'cursor-pointer'
        }`}
      >
        <div className="truncate">
          {selectedOption ? (
            <span className="font-medium text-slate-900">
              {selectedOption.label}
              {selectedOption.sublabel &&
              !selectedOption.label.toLowerCase().includes(selectedOption.sublabel.toLowerCase()) ? (
                <span className="ml-1 text-[11px] font-normal text-slate-500">
                  ({selectedOption.sublabel})
                </span>
              ) : null}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Hapus pilihan"
              className="rounded p-0.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-2.5 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ul className="max-h-56 overflow-y-auto py-1 text-xs">
            {filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <li
                  key={`${opt.value}-${opt.sublabel || idx}`}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(opt)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 transition ${
                    isHighlighted
                      ? 'bg-blue-50 text-blue-950'
                      : isSelected
                      ? 'bg-slate-50 font-semibold text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1 truncate">
                    <div className="truncate font-medium text-slate-900">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="truncate text-[10px] text-slate-500">{opt.sublabel}</div>
                    )}
                  </div>
                  {isSelected && <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-blue-600" />}
                </li>
              );
            })}

            {allowCustom && searchQuery.trim() && !hasExactMatch && (
              <li
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                onClick={() =>
                  handleSelect({
                    value: searchQuery.trim(),
                    label: searchQuery.trim(),
                  })
                }
                className={`flex cursor-pointer items-center justify-between border-t border-slate-100 px-3 py-2 text-xs font-semibold text-amber-700 transition ${
                  highlightedIndex === filteredOptions.length ? 'bg-amber-50' : 'hover:bg-amber-50/60'
                }`}
              >
                <span className="truncate">Gunakan &ldquo;{searchQuery.trim()}&rdquo;</span>
                <span className="ml-2 shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px]">
                  Kustom
                </span>
              </li>
            )}

            {filteredOptions.length === 0 && (!allowCustom || !searchQuery.trim()) && (
              <li className="px-3 py-4 text-center text-xs text-slate-400">{emptyText}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

