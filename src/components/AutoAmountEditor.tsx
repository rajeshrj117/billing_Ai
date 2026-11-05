"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Amt } from "@/lib/store";
import { sumAmts, useApp } from "@/lib/store";

type Props = {
  amounts: Amt[];
  onChange: (amounts: Amt[]) => void;
};

export function AutoAmountEditor({ amounts, onChange }: Props) {
  const { fmt } = useApp();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const amountsRef = useRef(amounts);
  amountsRef.current = amounts;

  const focusNext = useCallback((index: number) => {
    const current = amountsRef.current;
    const nextIndex = index + 1;
    if (timers.current[index]) {
      clearTimeout(timers.current[index]);
      delete timers.current[index];
    }
    if (nextIndex < current.length) {
      inputs.current[nextIndex]?.focus();
      inputs.current[nextIndex]?.select();
      return;
    }
    onChange([...current, { value: 0, confidence: 1, crossed: false }]);
    requestAnimationFrame(() => {
      inputs.current[nextIndex]?.focus();
    });
  }, [onChange]);

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout);
  }, []);

  function updateAmount(index: number, value: string) {
    const nextValue = value === "" ? 0 : Number(value);
    onChange(amounts.map((amount, i) => i === index
      ? { ...amount, value: Number.isFinite(nextValue) ? nextValue : 0, confidence: 1 }
      : amount));

    if (timers.current[index]) clearTimeout(timers.current[index]);
    if (value.trim() !== "" && Number.isFinite(nextValue) && nextValue > 0) {
      timers.current[index] = setTimeout(() => focusNext(index), 1000);
    }
  }

  function removeAmount(index: number) {
    if (timers.current[index]) clearTimeout(timers.current[index]);
    const next = amounts.filter((_, i) => i !== index);
    onChange(next.length ? next : [{ value: 0, confidence: 1, crossed: false }]);
    inputs.current.splice(index, 1);
    requestAnimationFrame(() => inputs.current[Math.max(0, index - 1)]?.focus());
  }

  return (
    <div className="space-y-2">
      {amounts.map((amount, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <input
            ref={(element) => { inputs.current[index] = element; }}
            type="number"
            inputMode="decimal"
            step="any"
            value={amount.value === 0 ? "" : String(amount.value)}
            placeholder={`Amount ${index + 1}`}
            onChange={(event) => updateAmount(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "=") {
                event.preventDefault();
                focusNext(index);
              }
            }}
            className={`w-36 rounded border px-3 py-2 ${amount.crossed ? "line-through opacity-50" : ""}`}
            aria-label={`Amount ${index + 1}`}
          />
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={!!amount.crossed}
              onChange={(event) => onChange(amounts.map((item, i) => i === index ? { ...item, crossed: event.target.checked } : item))}
            />
            Crossed out
          </label>
          <button type="button" onClick={() => removeAmount(index)} className="text-xs text-red-600">Delete</button>
        </div>
      ))}
      <p className="text-xs text-slate-500">Auto-next after 1 second. Press = or → to move immediately.</p>
      <p className="pt-2 text-lg font-semibold">Total: {fmt(sumAmts(amounts))}</p>
    </div>
  );
}
