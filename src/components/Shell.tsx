"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { InstallPrompt } from "@/components/InstallPrompt";

const nav = [
  ["/manual", "Manual Bill Entry"],
  ["/", "Dashboard"],
  ["/scan", "AI Camera Scanner"],
  ["/history", "Scan History"],
  ["/analytics", "Sales Analytics"],
  ["/settings", "Settings"],
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = (mobile = false) =>
    nav.map(([href, label]) => (
      <Link key={href} href={href} onClick={() => mobile && setMenuOpen(false)}
        aria-current={pathname === href ? "page" : undefined}
        className={`mb-1 block rounded-lg px-3 py-3 text-sm ${
          pathname === href ? "bg-orange-100 font-semibold text-orange-700" : "text-slate-600 hover:bg-slate-100"
        }`}>{label}</Link>
    ));

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden border-r bg-white p-4 md:block md:w-60 md:shrink-0">
        <h1 className="mb-3 text-xl font-bold text-slate-800">{settings.businessName} <span className="text-orange-500">AI</span></h1>
        <div className="mb-4"><InstallPrompt /></div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Workspace</p>
        {links()}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3">
          <h1 className="text-lg font-bold text-slate-800">{settings.businessName} <span className="text-orange-500">AI</span></h1>
          <div className="flex items-center gap-2"><InstallPrompt /><button type="button" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen}
            aria-controls="mobile-workspace-menu" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 md:hidden">{menuOpen ? "Close" : "☰ Menu"}</button></div>
        </header>
        {menuOpen && <>
          <button type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden" />
          <nav id="mobile-workspace-menu" className="absolute left-0 right-0 z-40 border-b bg-white p-4 shadow-lg md:hidden">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Workspace</p>
            {links(true)}
          </nav>
        </>}
        <main className="min-w-0 p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}
