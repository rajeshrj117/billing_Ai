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
