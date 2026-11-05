"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { keyOf } from "@/lib/dates";
import { sumAmts, useApp, type Amt, type Scan, buildWhatsAppBillMessage } from "@/lib/store";

export default function ManualBillEntry() {
  const { fmt, setScans } = useApp();
  const router = useRouter();
  const [amounts, setAmounts] = useState<Amt[]>([{ value: 0, confidence: 1 }]);
  const [date, setDate] = useState(keyOf(Date.now()));
  const [error, setError] = useState("");
  const [modalStep, setModalStep] = useState<"confirm" | "whatsapp" | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [savedEntry, setSavedEntry] = useState<Scan | null>(null);
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

  function requestConfirmation() {
    const valid = amounts.filter(
      (a) => !a.crossed && Number.isFinite(a.value) && a.value > 0
    );
    if (!valid.length) {
      setError("Please enter at least one amount greater than zero.");
      return;
    }
    setError("");
    setModalStep("confirm");
  }

  function confirmAndContinue() {
    const total = sumAmts(amounts);
    const entry: Scan = {
      id: crypto.randomUUID(),
      imageUrls: [],
      amounts,
      total,
      createdAt: Date.now(),
      dateKey: date,
    };

    setScans((previous) => [entry, ...previous]);
    setSavedEntry(entry);
    setModalStep("whatsapp");
  }

  function sendWhatsAppBill() {
    const entered = whatsappNumber.trim();
    let phone = entered.replace(/\D/g, "");
    if (phone.length === 10) phone = `91${phone}`;
    if (phone.length < 10 || phone.length > 15) {
      setError("Enter a valid WhatsApp number with country code, such as +91 9876543210.");
      return;
    }

    const bill = savedEntry;
    if (!bill) return;

    const message = buildWhatsAppBillMessage(
      bill.amounts,
      bill.total,
      bill.dateKey,
      "ScanBill AI",
      fmt
    );

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setModalStep(null);
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
                enterKeyHint="next"
                onKeyDown={(event) => {
                  const atEnd =
                    event.currentTarget.selectionStart === event.currentTarget.value.length &&
                    event.currentTarget.selectionEnd === event.currentTarget.value.length;
                  if (event.key === "Enter" || event.key === "NumpadEnter" || (event.key === "ArrowRight" && atEnd)) {
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
          <button type="button" onClick={requestConfirmation} className="rounded-lg bg-emerald-600 px-4 py-3 text-white">Confirm total &amp; save</button>
          <button type="button" onClick={() => { setAmounts([{ value: 0, confidence: 1 }]); setError(""); focusIndex.current = 0; }} className="rounded-lg border border-slate-200 px-4 py-3">Clear bill</button>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <p className="mt-4 text-xs text-slate-500">After confirmation, WhatsApp opens with the bill message ready. Review it and tap Send in WhatsApp.</p>
      </div>

      {modalStep && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && modalStep === "confirm") {
              setModalStep(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-modal-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-xl">
                  {modalStep === "confirm" ? "₹" : "✓"}
                </div>
                <div>
                  <h3 id="bill-modal-title" className="text-lg font-semibold text-slate-900">
                    {modalStep === "confirm" ? "Confirm your bill" : "Send bill on WhatsApp"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {modalStep === "confirm"
                      ? "Please check the total before saving."
                      : "The bill is saved. Enter the customer's number to share it."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              {modalStep === "confirm" ? (
                <>
                  <div className="rounded-xl bg-emerald-50 px-4 py-4">
                    <p className="text-sm text-emerald-800">Grand total</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-950">
                      {fmt(sumAmts(amounts))}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Active amounts</span>
                    <span className="font-medium text-slate-900">
                      {amounts.filter((a) => !a.crossed && a.value > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Sale date</span>
                    <span className="font-medium text-slate-900">{date}</span>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">
                    Confirming saves this bill to Scan History. You can then choose to share it through WhatsApp.
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-800">Bill saved successfully</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-950">
                      {savedEntry ? fmt(savedEntry.total) : fmt(sumAmts(amounts))}
                    </p>
                  </div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="customer-whatsapp">
                    Customer WhatsApp number
                    <div className="mt-2 flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                      <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-slate-600">
                        +
                      </span>
                      <input
                        id="customer-whatsapp"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        autoFocus
                        value={whatsappNumber}
                        onChange={(event) => {
                          setWhatsappNumber(event.target.value);
                          setError("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            sendWhatsAppBill();
                          }
                        }}
                        placeholder="91 9876543210"
                        className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
                      />
                    </div>
                  </label>
                  <p className="text-xs leading-5 text-slate-500">
                    Include the country code. WhatsApp will open with the bill message ready; review it and tap Send.
                  </p>
                </>
              )}

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {modalStep === "confirm" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setModalStep(null)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Go back
                  </button>
                  <button
                    type="button"
                    onClick={confirmAndContinue}
                    className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Confirm &amp; save bill
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setModalStep(null);
                      router.push("/history");
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={sendWhatsAppBill}
                    className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Open WhatsApp
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
