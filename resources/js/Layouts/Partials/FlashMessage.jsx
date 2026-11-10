import React, { useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Sparkles, AlertCircle, X } from 'lucide-react';

export default function FlashMessage() {
  const { flash } = usePage().props;
  const [activeFlash, setActiveFlash] = useState({
    success: flash?.success || null,
    error: flash?.error || null,
    key: Date.now(),
  });
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(Boolean(flash?.success || flash?.error));

  // Tangkap pembaruan props flash termasuk jika pesan yang sama dikirim berulang kali
  useEffect(() => {
    if (flash?.success || flash?.error) {
      setActiveFlash({
        success: flash?.success || null,
        error: flash?.error || null,
        key: Date.now(),
      });
    }
  }, [flash?.success, flash?.error]);

  useEffect(() => {
    const removeListener = router.on('success', (event) => {
      const nextFlash = event?.detail?.page?.props?.flash;
      if (nextFlash?.success || nextFlash?.error) {
        setActiveFlash({
          success: nextFlash.success || null,
          error: nextFlash.error || null,
          key: Date.now(),
        });
      }
    });

    return () => removeListener();
  }, []);

  // Tampilkan selama 3 detik lalu memudar (fade-out) secara halus
  useEffect(() => {
    if (!activeFlash.success && !activeFlash.error) {
      setVisible(false);
      setFading(false);
      return undefined;
    }

    setVisible(true);
    setFading(false);

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2600);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      setFading(false);
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [activeFlash.key, activeFlash.success, activeFlash.error]);

  const dismissNow = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      setFading(false);
    }, 300);
  };

  if (!visible || (!activeFlash.success && !activeFlash.error)) {
    return null;
  }

  const transitionClass = `transition-all duration-400 ease-out ${
    fading ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'
  }`;

  return (
    <>
      {activeFlash.success && (
        <div
          role="status"
          className={`mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm ${transitionClass}`}
        >
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{activeFlash.success}</span>
          </div>
          <button
            type="button"
            onClick={dismissNow}
            className="ml-3 rounded-lg p-1 text-emerald-600/70 hover:bg-emerald-100 hover:text-emerald-800 transition"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeFlash.error && (
        <div
          role="alert"
          className={`mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-sm ${transitionClass}`}
        >
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-medium">{activeFlash.error}</span>
          </div>
          <button
            type="button"
            onClick={dismissNow}
            className="ml-3 rounded-lg p-1 text-red-600/70 hover:bg-red-100 hover:text-red-800 transition"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
