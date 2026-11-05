"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { keyOf } from "@/lib/dates";
import { sumAmts, useApp, type Amt, type Scan } from "@/lib/store";

export default function ManualBillEntry() {
  const { fmt, setScans } = useApp();
  const router = useRouter();
  const [amounts, setAmounts] = useState<Amt[]>([{ value: 0, confidence: 1 }]);
  const [date, setDate] = useState(keyOf(Date.now()));
  const [error, setError] = useState("");
  const amountInputs = useRef<Array<HTMLInputElement | null>>([]);
  const focusIndex = useRef<number | null>(null);

  useEffect(() => {
    if (focusIndex.current === null) return;
    const index = focusIndex.current;
    focusIndex.current = null;
    amountInputs.current[index]?.focus();
    amountInputs.current[index]?.select();
  }, [amounts]);

  function addAmountAndFocus(index = amounts.length) {
    const nextIndex = index;
    setAmounts((current) => {
      if (nextIndex < current.length) {
        focusIndex.current = nextIndex;
        return current;
      }
      focusIndex.current = current.length;
      return [...current, { value: 0, confidence: 1 }];
    });
  }

  function moveNext(index: number) {
    addAmountAndFocus(index + 1);
  }

  function updateAmount(index: number, rawValue: string) {
    const parsed = rawValue.trim() === "" ? 0 : Number(rawValue);
    setAmounts((current) =>
      current.map((amount, i) =>
        i === index
          ? { ...amount, value: Number.isFinite(parsed) ? parsed : 0 }
          : amount
      )
    );
  }

  function confirmAndSend() {
    const valid = amounts.filter((a) => !a.crossed && Number.isFinite(a.value) && a.value > 0);
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

    const lines = amounts.map((a, i) => `${i + 1}. ${a.crossed ? "CANCELLED — " : ""}${fmt(a.value)}`);
    const message = ["*Bill from ScanBill AI*", `Date: ${date}`, "", ...lines, "", `*Grand Total: ${fmt(total)}*`, "Thank you!"].join("\n");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    router.push("/history");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="font-semibold">Review amounts</h2>
          <p className="text-xs text-slate-500">Enter bill amounts, correct values and mark crossed-out entries.</p>
        </div>

        <div className="space-y-3">
          {amounts.map((amount, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <input
                ref={(element) => { amountInputs.current[index] = element; }}
                type="text"
                inputMode="decimal"
                value={amount.value === 0 ? "" : amount.value}
                onChange={(event) => updateAmount(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "=" || (event.key === "ArrowRight" &&
                    event.currentTarget.selectionStart === event.currentTarget.value.length &&
                    event.currentTarget.selectionEnd === event.currentTarget.value.length)) {
                    event.preventDefault();
                    moveNext(index);
                  }
                }}
                aria-label={`Amount ${index + 1}`}
                placeholder="Enter amount"
                className="w-32 rounded border border-slate-300 px-3 py-2"
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(amount.crossed)}
                  onChange={(event) =>
                    setAmounts((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, crossed: event.target.checked } : item
                      )
                    )
                  }
                />
                Crossed out
              </label>
              <button
                type="button"
                onClick={() => moveNext(index)}
                className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold"
                aria-label={`Next amount after row ${index + 1}`}
                title="Move to next amount"
              >
                =
              </button>
              <button
                type="button"
                onClick={() => moveNext(index)}
                className="rounded border border-slate-300 px-3 py-2 text-sm"
                aria-label={`Next amount arrow after row ${index + 1}`}
                title="Move to next amount"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmounts((current) => {
                    const next = current.filter((_, i) => i !== index);
                    if (next.length === 0) next.push({ value: 0, confidence: 1 });
                    focusIndex.current = Math.min(index, next.length - 1);
                    return next;
                  });
                }}
                className="text-sm text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addAmountAndFocus()}
            className="text-sm text-indigo-600 hover:underline"
          >
            + Add amount
          </button>
        </div>

        <p className="mt-5 text-lg font-bold">Total: {fmt(sumAmts(amounts))}</p>

        <label className="mt-5 block text-sm">
          Sale date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 px-3 py-2" />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={confirmAndSend} className="rounded-lg bg-emerald-600 px-4 py-3 text-white">Confirm total &amp; save</button>
          <button type="button" onClick={() => { setAmounts([{ value: 0, confidence: 1 }]); setError(""); focusIndex.current = 0; }} className="rounded-lg border border-slate-200 px-4 py-3">Clear bill</button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <p className="mt-4 text-xs text-slate-500">After confirmation, WhatsApp opens with the bill message ready. Review it and tap Send in WhatsApp.</p>
      </div>
    </div>
  );
}
