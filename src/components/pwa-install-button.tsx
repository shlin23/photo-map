"use client";

import { useEffect, useState } from "react";

import { withBasePath } from "@/lib/app-path";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    queueMicrotask(() => setIsInstalled(standalone));

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register(withBasePath("/sw.js"), { scope: withBasePath("/") });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  async function handleInstall() {
    if (!installPrompt) {
      setShowInstructions((visible) => !visible);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setInstallPrompt(null);
  }

  return (
    <div className="pwa-install">
      <button className="install-button" type="button" onClick={() => void handleInstall()}>
        Install App
      </button>
      {showInstructions && (
        <div className="install-instructions" role="status">
          <strong>Install RAIL PM</strong>
          <span>On iPhone or iPad, tap Share, then Add to Home Screen, then Add.</span>
          <span>On other browsers, open the browser menu and choose Install App or Add to Home Screen.</span>
        </div>
      )}
    </div>
  );
}
