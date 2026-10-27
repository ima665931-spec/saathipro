"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "sp_pwa_dismiss";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIsStandalone(!!standalone);
    if (standalone) return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    // iOS: no beforeinstallprompt — show soft tip once per session
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) {
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (isStandalone || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setDeferred(null);
    dismiss();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md">
      <div className="rounded-2xl border border-border bg-white shadow-soft p-4 flex gap-3 items-start">
        <div className="w-11 h-11 rounded-xl bg-brand-gradient text-white flex items-center justify-center font-display font-bold shrink-0">
          S
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-ink text-sm">Install SaathiPro</p>
          <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
            {deferred
              ? "Add to your home screen for quick access — app-like experience."
              : "On iPhone: Share → Add to Home Screen."}
          </p>
          <div className="mt-3 flex gap-2">
            {deferred && (
              <button
                type="button"
                onClick={install}
                className="btn-brand text-xs px-4 py-2 rounded-full"
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="text-xs font-medium text-ink-muted px-3 py-2"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
