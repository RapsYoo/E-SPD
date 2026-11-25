import React from 'react';
import { Info } from 'lucide-react';

/**
 * Reusable Hover Tooltip untuk menyembunyikan petunjuk/bantuan panjang
 * agar antarmuka tetap bersih dan minimalis.
 */
export default function InfoTooltip({
  title = 'Petunjuk',
  text = '',
  children = null,
  align = 'left',
  label = null,
  className = '',
}) {
  const alignClass =
    align === 'right'
      ? 'right-0'
      : align === 'center'
        ? 'left-1/2 -translate-x-1/2'
        : 'left-0';

  return (
    <span className={`group relative inline-flex items-center ${className}`}>
      <button
        type="button"
        aria-label={title}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
      >
        <Info className="h-3.5 w-3.5 shrink-0" />
        {label && <span>{label}</span>}
      </button>

      <div
        role="tooltip"
        className={`pointer-events-none invisible absolute top-full z-50 mt-2 w-72 sm:w-80 rounded-xl border border-slate-700/80 bg-slate-900/95 p-3.5 text-left text-[11px] leading-relaxed text-slate-200 opacity-0 shadow-xl backdrop-blur-sm transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${alignClass}`}
      >
        {title && (
          <p className="mb-1 text-xs font-bold text-amber-400">{title}</p>
        )}
        {text ? <p>{text}</p> : children}
      </div>
    </span>
  );
}
