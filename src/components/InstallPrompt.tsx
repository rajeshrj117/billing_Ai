 "use client";
import { useEffect, useState } from "react";
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & {standalone?: boolean}).standalone === true;
    setInstalled(standalone);
    const onBefore = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator && window.isSecureContext) navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => { window.removeEventListener("beforeinstallprompt", onBefore); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (installed) return <span className="text-xs font-medium text-emerald-700">App installed</span>;
  const install = async () => {
    if (installEvent) { await installEvent.prompt(); await installEvent.userChoice; setInstallEvent(null); }
    else setIosHelp(true);
  };
  return <div className="flex items-center gap-2">
    <button onClick={install} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600">
      Install app
    </button>
    {iosHelp && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIosHelp(false)}>
      <div className="max-w-sm rounded-xl bg-white p-5 text-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="mb-2 text-lg font-bold">Add ScanBill AI to your Home Screen</h2>
        <p className="text-slate-600">In Safari, tap the Share icon, then choose <b>Add to Home Screen</b> and tap Add.</p>
        <button className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white" onClick={() => setIosHelp(false)}>Got it</button>
      </div>
    </div>}
  </div>;
}
