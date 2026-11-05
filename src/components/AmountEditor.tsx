"use client";

import { useEffect, useRef, useState } from "react";
import { Amt, sumAmts, useApp } from "@/lib/store";

export function AmountEditor({
  amounts,
  onChange,
}: {
  amounts: Amt[];
  onChange: (amounts: Amt[]) => void;
}) {
  const { fmt } = useApp();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  function updateAmount(index: number, patch: Partial<Amt>) {
    onChange(amounts.map((amount, i) =>
      i === index ? { ...amount, ...patch } : amount
    ));
  }

  function addAndFocusNext() {
    const nextIndex = amounts.length;
    onChange([...amounts, { value: 0, confidence: 1 }]);
    setFocusIndex(nextIndex);
  }

  useEffect(() => {
    if (focusIndex === null) return;
    inputs.current[focusIndex]?.focus();
    setFocusIndex(null);
  }, [amounts.length, focusIndex]);

  function moveToNext(index: number) {
    const nextIndex = index + 1;

    if (nextIndex < amounts.length) {
      inputs.current[nextIndex]?.focus();
      inputs.current[nextIndex]?.select();
      return;
    }

    addAndFocusNext();
  }

  return (
    <div className="space-y-2">
      {amounts.map((amount, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <input
            ref={(element) => {
              inputs.current[index] = element;
            }}
            type="text"
            inputMode="decimal"
            enterKeyHint="next"
            pattern="[0-9]*[.,]?[0-9]*"
            value={amount.value === 0 ? "" : String(amount.value)}
            placeholder="Enter amount"
            onChange={(event) => {
              const rawValue = event.target.value.replace(",", ".");
              const parsed = rawValue === "" ? 0 : Number(rawValue);
              if (rawValue === "" || Number.isFinite(parsed)) {
                updateAmount(index, { value: parsed, confidence: 1 });
              }
            }}
            onKeyDown={(event) => {
              // Mobile keyboards commonly show a Next/Done key rather than
              // calculator keys. Enter advances to the next amount.
              if (event.key === "Enter") {
                event.preventDefault();
                moveToNext(index);
              } else if (
                event.key === "ArrowRight" &&
                event.currentTarget.selectionStart === event.currentTarget.value.length &&
                event.currentTarget.selectionEnd === event.currentTarget.value.length
              ) {
                event.preventDefault();
                moveToNext(index);
              }
            }}
            className={`w-32 rounded border px-2 py-2 ${
              amount.crossed ? "line-through opacity-50" : ""
            }`}
          />

          {amount.confidence < 0.7 && !amount.crossed && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
              Unsure {Math.round(amount.confidence * 100)}%
            </span>
          )}

          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={!!amount.crossed}
              onChange={(event) =>
                updateAmount(index, { crossed: event.target.checked })
              }
            />
            Crossed out
          </label>

          <button
            type="button"
            onClick={() => {
              onChange(amounts.filter((_, i) => i !== index));
              inputs.current.splice(index, 1);
            }}
            className="text-xs text-red-600"
          >
            Delete
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addAndFocusNext}
        className="text-sm text-indigo-600"
      >
        + Add amount
      </button>

      <p className="pt-2 text-lg font-semibold">
        Total: {fmt(sumAmts(amounts))}
      </p>
    </div>
  );
}
