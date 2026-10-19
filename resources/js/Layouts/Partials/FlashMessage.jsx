import React from 'react';
import { usePage } from '@inertiajs/react';
import { Sparkles, X } from 'lucide-react';

export default function FlashMessage() {
  const { flash } = usePage().props;

  if (!flash?.success && !flash?.error) {
    return null;
  }

  return (
    <>
      {flash?.success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{flash.success}</span>
          </div>
        </div>
      )}

      {flash?.error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <X className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{flash.error}</span>
          </div>
        </div>
      )}
    </>
  );
}
