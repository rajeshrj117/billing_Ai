
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sumAmts, useApp, type Amt, type Scan } from "@/lib/store";
import { keyOf } from "@/lib/dates";
import { AmountEditor } from "@/components/AmountEditor";

const shrink = (src: string) =>
  new Promise<string>((res) => {
    const i = new Image();

    i.onload = () => {
      const s = Math.min(1, 1400 / Math.max(i.width, i.height));
      const c = document.createElement("canvas");

      c.width = i.width * s;
      c.height = i.height * s;

      c.getContext("2d")!.drawImage(i, 0, 0, c.width, c.height);

      res(c.toDataURL("image/jpeg", 0.82));
    };

    i.onerror = () => res(src);
    i.src = src;
  });

export default function Scan() {
  const { fmt, setScans } = useApp();
  const router = useRouter();

  const vid = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  const [pages, setPages] = useState<string[]>([]);
  const [amts, setAmts] = useState<Amt[] | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [cam, setCam] = useState(false);
  const [date, setDate] = useState(keyOf(Date.now()));

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setCam(false);
  };

  useEffect(() => {
    return () => {
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setErr("");

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
        },
        audio: false,
      });

      setCam(true);

      setTimeout(() => {
        if (vid.current && stream.current) {
          vid.current.srcObject = stream.current;
        }
      }, 100);
    } catch {
      setErr(
        "Camera blocked or unavailable. Allow camera access or upload images."
      );
    }
  }

  async function snap() {
    if (!vid.current || !vid.current.videoWidth) {
      setErr("Camera is not ready. Please try again.");
      return;
    }

    const v = vid.current;
    const c = document.createElement("canvas");

    c.width = v.videoWidth;
    c.height = v.videoHeight;

    c.getContext("2d")!.drawImage(v, 0, 0);

    const d = await shrink(c.toDataURL("image/jpeg", 0.9));

    setPages((p) => [...p, d]);
    setErr("");
  }

  async function files(e: React.ChangeEvent<HTMLInputElement>) {
    for (const f of Array.from(e.target.files || [])) {
      const d = await new Promise<string>((r) => {
        const fr = new FileReader();

        fr.onload = () => r(fr.result as string);
        fr.readAsDataURL(f);
      });

      const compressed = await shrink(d);

      setPages((p) => [...p, compressed]);
    }

    e.target.value = "";
  }

  async function extract() {
    setBusy("Reading bill with Groq AI…");
    setErr("");

    try {
      const r = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ images: pages }),
      });

      const j = await r.json();

      if (!r.ok) {
        throw new Error(j.error || "AI scan failed");
      }

      setAmts(j.amounts || []);
      stop();

      if (!j.amounts?.length) {
        setErr(
          "No amounts detected. Try a clearer image or add amounts manually."
        );
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "AI scan failed");
    } finally {
      setBusy("");
    }
  }

  function save() {
    if (!amts) return;

    const total = sumAmts(amts);

    if (!confirm(`Confirm total ${fmt(total)} and save?`)) return;

    const createdAt = Date.now();

    const entry: Scan = {
      id: crypto.randomUUID(),
      imageUrls: pages,
      amounts: amts,
      total,
      createdAt,
      dateKey: date,
    };

    setScans((p) => [entry, ...p]);
    router.push("/history");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">

      {!amts && (
        <>
          <div className="rounded-xl border bg-white p-3 sm:p-4">

            {/* Camera preview */}
            {cam && (
              <div className="relative mb-3 overflow-hidden rounded-lg bg-black">

                <video
                  ref={vid}
                  autoPlay
                  playsInline
                  muted
                  onClick={snap}
                  className="block w-full cursor-crosshair rounded-lg bg-black"
                />

                {/* Clickable capture border */}
                <button
                  type="button"
                  onClick={snap}
                  aria-label="Tap to capture image"
                  title="Tap inside the frame to capture"
                  className="absolute inset-4 z-10 w-[calc(100%-2rem)] cursor-crosshair rounded border-2 border-dashed border-white/90 bg-transparent focus:outline-none focus:ring-4 focus:ring-orange-400/70 sm:inset-6 sm:w-[calc(100%-3rem)]"
                />

                <p className="pointer-events-none absolute bottom-3 left-0 right-0 z-20 text-center text-xs font-semibold text-white drop-shadow">
                  Tap inside the frame to capture
                </p>
              </div>
            )}

            {/* Camera controls */}
            <div className="flex flex-wrap gap-2">

              {!cam ? (
                <button
                  type="button"
                  onClick={start}
                  className="rounded-lg bg-orange-500 px-4 py-2.5 text-white"
                >
                  Open camera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={snap}
                    className="rounded-lg bg-orange-500 px-4 py-2.5 text-white"
                  >
                    Capture page
                  </button>

                  <button
                    type="button"
                    onClick={stop}
                    className="rounded-lg border px-4 py-2.5"
                  >
                    Close camera
                  </button>
                </>
              )}

              <label className="cursor-pointer rounded-lg border bg-white px-4 py-2.5">
                Upload images

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={files}
                />
              </label>

            </div>

            {/* Captured pages */}
            {pages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pages.map((p, i) => (
                  <div key={i} className="relative">
                    <img
                      src={p}
                      alt={`Captured page ${i + 1}`}
                      className="h-24 w-20 rounded border object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setPages((prev) =>
                          prev.filter((_, j) => j !== i)
                        )
                      }
                      aria-label={`Remove page ${i + 1}`}
                      className="absolute right-0 top-0 rounded-bl bg-red-600 px-2 text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* AI extraction */}
            {pages.length > 0 && (
              <button
                type="button"
                disabled={!!busy}
                onClick={extract}
                className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-white disabled:opacity-50"
              >
                {busy ||
                  `Extract amounts with Groq AI (${pages.length} page${
                    pages.length > 1 ? "s" : ""
                  })`}
              </button>
            )}

          </div>
        </>
      )}

      {/* Amount review */}
      {amts && (
        <div className="space-y-4 rounded-xl border bg-white p-4 sm:p-5">

          <div>
            <h3 className="font-semibold">
              Review detected amounts
            </h3>

            <p className="text-xs text-slate-500">
              Correct uncertain values and mark crossed-out entries.
            </p>
          </div>

          <AmountEditor
            amounts={amts}
            onChange={setAmts}
          />

          <label className="block text-sm">
            Sale date

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </label>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              disabled={!!busy}
              onClick={save}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white"
            >
              Confirm total & save
            </button>

            <button
              type="button"
              onClick={() => setAmts(null)}
              className="rounded-lg border px-4 py-2"
            >
              Back
            </button>

          </div>
        </div>
      )}

      {/* Error messages */}
      {err && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {err}
        </p>
      )}

    </div>
  );
}
