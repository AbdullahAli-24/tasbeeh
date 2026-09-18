"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DEFAULT_DHIKR, defaultAdhkar } from "@/data/adhkar";
import { STORAGE_KEYS } from "@/constants/storage";
import { CheckIcon, ResetIcon, TrashIcon } from "./icons";

type PersistedState = { currentDhikr: string; count: number; target: number | null };

const isTextField = (element: EventTarget | null) =>
  element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement || (element instanceof HTMLElement && element.isContentEditable);

function readSavedAdhkar(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_ADHKAR) ?? "[]");
    return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))] : [];
  } catch { return []; }
}

function readState(): PersistedState | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASBEEH_STATE) ?? "null");
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<PersistedState>;
    const currentDhikr = typeof candidate.currentDhikr === "string" && candidate.currentDhikr.trim() ? candidate.currentDhikr.trim() : DEFAULT_DHIKR;
    const count = typeof candidate.count === "number" && Number.isFinite(candidate.count) && candidate.count >= 0 ? Math.floor(candidate.count) : 0;
    const target = typeof candidate.target === "number" && Number.isInteger(candidate.target) && candidate.target > 0 ? candidate.target : null;
    return { currentDhikr, count, target };
  } catch { return null; }
}

export default function TasbeehApp() {
  const [currentDhikr, setCurrentDhikr] = useState<string>(DEFAULT_DHIKR);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState<number | null>(33);
  const [targetText, setTargetText] = useState("33");
  const [savedAdhkar, setSavedAdhkar] = useState<string[]>([]);
  const [customDhikr, setCustomDhikr] = useState("");
  const [message, setMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((text: string) => {
    setMessage(text);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(""), 2600);
  }, []);

  useEffect(() => {
    const persisted = readState();
    const saved = readSavedAdhkar();
    const timer = window.setTimeout(() => {
      if (persisted) {
        setCurrentDhikr(persisted.currentDhikr);
        setCount(persisted.count);
        setTarget(persisted.target);
        setTargetText(persisted.target?.toString() ?? "");
      }
      setSavedAdhkar(saved);
      setHydrated(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.TASBEEH_STATE, JSON.stringify({ currentDhikr, count, target })); } catch { /* optional persistence */ }
  }, [currentDhikr, count, target, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.SAVED_ADHKAR, JSON.stringify(savedAdhkar)); } catch { /* optional persistence */ }
  }, [savedAdhkar, hydrated]);

  const increment = useCallback(() =>  setCount((previous) => previous + 1), []);
  const selectDhikr = (dhikr: string) => { setCurrentDhikr(dhikr); setCount(0); };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.repeat && !isTextField(event.target)) increment();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [increment]);

  const saveDhikr = (event: FormEvent) => {
    event.preventDefault();
    const cleanDhikr = customDhikr.replace(/\s+/g, " ").trim();
    if (!cleanDhikr) { notify("اكتب ذكراً أولاً لحفظه"); return; }
    if (defaultAdhkar.includes(cleanDhikr as (typeof defaultAdhkar)[number]) || savedAdhkar.includes(cleanDhikr)) { notify("هذا الذكر موجود بالفعل"); setCustomDhikr(""); return; }
    setSavedAdhkar((previous) => [...previous, cleanDhikr]);
    setCustomDhikr("");
    selectDhikr(cleanDhikr);
    notify("تم حفظ الذكر واختياره");
  };

  const handleTargetChange = (value: string) => {
    setTargetText(value);
    if (!value.trim()) { setTarget(null); return; }
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) setTarget(parsed);
  };

  const isReached = target !== null && count >= target;
  const progress = target ? Math.min((count / target) * 100, 100) : 0;
  const allAdhkar = [...defaultAdhkar, ...savedAdhkar];

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-[#173a35] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-9 flex items-center justify-between border-b border-[#d7e0d7] pb-5 sm:mb-12">
          <div><p className="text-2xl font-bold tracking-tight">سبحة</p><p className="mt-1 text-sm text-[#64766d]">سبحتك الإلكترونية</p></div>
          <div className="rounded-full border border-[#cfe0d4] bg-[#edf4ed] px-3 py-1.5 text-xs font-medium text-[#47705e]">اضغط Enter للتسبيح</div>
        </header>

        <section className="mx-auto max-w-2xl" aria-label="عداد التسبيح">
          <div className={`rounded-[2rem] border bg-white p-5 shadow-[0_18px_50px_-32px_rgba(20,70,55,.45)] sm:p-8 ${isReached ? "border-[#9ccfae]" : "border-[#e0e7e0]"}`}>
            <div className="text-center">
              <p className="text-sm font-medium text-[#718078]">الذكر الحالي</p>
              <h1 className="mt-2 min-h-10 text-2xl font-bold leading-relaxed text-[#1f4d42] sm:text-3xl">{currentDhikr}</h1>
              <p className="mt-7 tabular-nums text-7xl font-semibold tracking-[-0.06em] text-[#173a35] sm:text-8xl" dir="ltr">{count}</p>
              {target && <div className="mx-auto mt-5 max-w-md"><div className="flex justify-between text-sm text-[#63746c]" dir="ltr"><span>{count}</span><span className="font-medium">{target} / الهدف</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e6ece5]"><div className="h-full rounded-full bg-[#4f8971] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div></div>}
              {isReached && <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e7f5e9] px-3 py-2 text-sm font-medium text-[#367151]"><CheckIcon className="h-4 w-4" />تم الوصول إلى الهدف</div>}
            </div>

            <button type="button" onClick={increment} className="mt-8 flex min-h-32 w-full select-none items-center justify-center rounded-[1.5rem] bg-[#1f6150] text-2xl font-bold text-white shadow-[0_12px_24px_-14px_rgba(20,83,65,.75)] transition duration-150 hover:bg-[#195342] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#7eb39c] active:scale-[.985] sm:min-h-36" aria-label="زيادة العداد"><span>سبّح</span></button>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setCount((previous) => Math.max(0, previous - 1))} disabled={count === 0} className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[#d9e2da] text-2xl font-medium text-[#3d5d52] transition hover:bg-[#f4f8f4] disabled:cursor-not-allowed disabled:opacity-40" aria-label="إنقاص العداد">−</button>
              <button type="button" onClick={() => setCount(0)} className="flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-xl border border-[#d9e2da] px-4 text-sm font-semibold text-[#3d5d52] transition hover:bg-[#f4f8f4]"><ResetIcon className="h-4 w-4" />إعادة العداد</button>
            </div>
          </div>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <div className="rounded-2xl border border-[#e0e7e0] bg-white p-5"><label htmlFor="target" className="text-base font-bold">الهدف</label><p className="mt-1 text-sm text-[#718078]">اختياري — أضف عدداً لتتبع تقدمك</p><input id="target" inputMode="numeric" type="number" min="1" step="1" value={targetText} onChange={(event) => handleTargetChange(event.target.value)} placeholder="مثال: 33" className="mt-4 h-12 w-full rounded-xl border border-[#d6e0d7] bg-[#fafcf9] px-4 text-center text-lg outline-none transition focus:border-[#5d987b] focus:ring-3 focus:ring-[#dcefe4]" dir="ltr" /></div>
            <form onSubmit={saveDhikr} className="rounded-2xl border border-[#e0e7e0] bg-white p-5"><label htmlFor="dhikr" className="text-base font-bold">ذكر جديد</label><p className="mt-1 text-sm text-[#718078]">اكتب الذكر الذي تريد حفظه والتسبيح به</p><div className="mt-4 flex gap-2"><input id="dhikr" value={customDhikr} onChange={(event) => setCustomDhikr(event.target.value)} placeholder="اكتب الذكر هنا..." className="h-12 min-w-0 flex-1 rounded-xl border border-[#d6e0d7] bg-[#fafcf9] px-4 outline-none transition focus:border-[#5d987b] focus:ring-3 focus:ring-[#dcefe4]" /><button type="submit" className="rounded-xl bg-[#e7f1e9] px-4 text-sm font-bold text-[#245845] transition hover:bg-[#d9ebdd]">حفظ</button></div></form>
          </section>

          <section className="mt-8"><div className="mb-3 flex items-baseline justify-between"><h2 className="text-lg font-bold">أذكار مختارة</h2><span className="text-xs text-[#718078]">اختر ذكراً للبدء من جديد</span></div><div className="flex flex-wrap gap-2">{allAdhkar.map((dhikr) => <button type="button" key={dhikr} onClick={() => selectDhikr(dhikr)} className={`rounded-full border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7eb39c] ${currentDhikr === dhikr ? "border-[#3e8066] bg-[#e3f1e6] text-[#205b47]" : "border-[#d7e1d8] bg-white text-[#4a655a] hover:border-[#9cbaaa]"}`}>{dhikr}</button>)}</div></section>

          <section className="mt-8 border-t border-[#dce4dc] pt-7"><h2 className="text-lg font-bold">أذكاري المحفوظة</h2>{savedAdhkar.length ? <div className="mt-3 grid gap-2">{savedAdhkar.map((dhikr) => <div key={dhikr} className="flex items-center justify-between rounded-xl border border-[#dce5dd] bg-white px-4 py-3"><button type="button" onClick={() => selectDhikr(dhikr)} className="min-h-9 flex-1 text-right font-medium text-[#36594d] hover:text-[#1f614e]">{dhikr}</button><button type="button" onClick={() => { setSavedAdhkar((previous) => previous.filter((item) => item !== dhikr)); notify("تم حذف الذكر المحفوظ"); }} className="mr-3 rounded-lg p-2 text-[#8b5f5c] transition hover:bg-[#f8eeee] focus-visible:outline-2 focus-visible:outline-[#b66b66]" aria-label={`حذف ${dhikr}`}><TrashIcon className="h-4 w-4" /></button></div>)}</div> : <p className="mt-3 rounded-xl bg-[#eef3ee] px-4 py-4 text-sm text-[#718078]">لم تحفظ أي أذكار بعد. أضف ذكراً خاصاً بك من الأعلى.</p>}</section>
        </section>
      </div>
      <div aria-live="polite" className={`pointer-events-none fixed inset-x-4 bottom-5 z-10 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-full bg-[#173a35] px-4 py-3 text-sm font-medium text-white shadow-lg transition ${message ? "opacity-100" : "opacity-0"}`}>{message}</div>
    </main>
  );
}
