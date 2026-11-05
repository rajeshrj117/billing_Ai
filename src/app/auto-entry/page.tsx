"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AutoAmountEditor } from "@/components/AutoAmountEditor";
import { keyOf } from "@/lib/dates";
import { sumAmts, useApp, type Amt, type Scan } from "@/lib/store";

export default function AutoEntryPage() {
  const { fmt, setScans } = useApp();
  const router = useRouter();
  const [amounts, setAmounts] = useState<Amt[]>([{ value: 0, confidence: 1, crossed: false }]);
  const [date, setDate] = useState(keyOf(Date.now()));
  const [error, setError] = useState("");

  function confirmAndSend() {
    const valid = amounts.filter((amount) => !amount.crossed && Number.isFinite(amount.value) && amount.value > 0);
    if (!valid.length) {
      setError("Please enter at least one amount greater than zero.");
      return;
    }
    const total = sumAmts(amounts);
    if (!window.confirm(`Confirm bill total ${fmt(total)}?`)) return;

    const entry: Scan = {
      id: crypto.randomUUID(),
      imageUrls: [],
      amounts,
      total,
      createdAt: Date.now(),
      dateKey: date,
    };
    setScans((previous) => [entry, ...previous]);

    const entered = window.prompt("Enter customer's WhatsApp number with country code (example: +91 9876543210):");
    if (entered === null || !entered.trim()) {
      router.push("/history");
      return;
    }
    let phone = entered.replace(/\D/g, "");
    if (phone.length === 10) phone = `91${phone}`;
    if (phone.length < 10 || phone.length > 15) {
      setError("Bill saved, but the WhatsApp number looks invalid. Open Scan History and try again with country code.");
      return;
    }

    const lines = amounts.filter((amount) => amount.value > 0).map((amount, index) => `${index + 1}. ${amount.crossed ? "CANCELLED — " : ""}${fmt(amount.value)}`);
    const message = ["*Bill from ScanBill AI*", `Date: ${date}`, "", ...lines, "", `*Grand Total: ${fmt(total)}*`, "Thank you!"].join("\n");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    router.push("/history");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="font-semibold">Auto Entry</h2>
          <p className="text-xs text-slate-500">Enter amounts one after another. The next field opens automatically after 1 second, or immediately when you press = or the right arrow key.</p>
        </div>
        <AutoAmountEditor amounts={amounts} onChange={setAmounts} />
        <label className="mt-5 block text-sm">
          Sale date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 block w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={confirmAndSend} className="rounded-lg bg-emerald-600 px-4 py-3 text-white">Confirm total & save</button>
          <button type="button" onClick={() => { setAmounts([{ value: 0, confidence: 1, crossed: false }]); setError(""); }} className="rounded-lg border border-slate-200 px-4 py-3">Clear bill</button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <p className="mt-4 text-xs text-slate-500">After confirmation, WhatsApp opens with the bill message ready. Review it and tap Send in WhatsApp.</p>
      </div>
    </div>
  );
}
