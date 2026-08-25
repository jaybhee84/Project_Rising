"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  fetchMooeRecords,
  getCachedMooeRecords,
  MONTHS,
  subscribeToMooeRecords,
  type MooeRecord,
  type ReceiptItem,
} from "@/lib/mooeData";

const OBJECT_CODE_MAP: Record<string, string> = {
  "5020101000": "Traveling Expenses - Local",
  "5020201000": "Training Expenses",
  "5020301000": "Office Supplies Expenses",
  "5020302000": "Accountable Forms Expenses",
  "5020303000": "Non-Accountable Forms Expenses",
  "5020304000": "Animal/Zoological Supplies Expenses",
  "5020305000": "Food Supplies Expenses",
  "5020307000": "Drugs and Medicines Expenses",
  "5020308000": "Medical, Dental & Lab Supplies",
  "5020309000": "Fuel, Oil and Lubricants Expenses",
  "5020311000": "Textbooks and Instructional Materials",
  "5020311001": "Semi-Expendable - Machinery",
  "5020311002": "Semi-Expendable - Office Equipment / Teaching Supplies",
  "5020311003": "Semi-Expendable - ICT Equipment",
  "5020311004": "Semi-Expendable - Communications Equipment",
  "5020311007": "Semi-Expendable - Printing Equipment",
  "5020311013": "Semi-Expendable - Furniture & Fixtures",
  "5020321099": "Semi-Expendable - Other Property",
  "5020399000": "Other Supplies and Materials Expenses",
  "5020401000": "Water Expenses",
  "5020402000": "Electricity Expenses",
  "5020501000": "Postage and Courier Services",
  "5020502001": "Telephone Expenses - Mobile",
  "5020502002": "Telephone Expenses - Landline",
  "5020503000": "Internet Subscription Expenses",
  "5020601000": "Awards and Rewards Expenses",
  "5021199000": "Other Professional Services",
  "5021202000": "Janitorial Services",
  "5021203000": "Security Services",
  "5021299000": "Other General Services",
  "5021304001": "R&M - Buildings and Other Structures",
  "5021307000": "R&M - Furniture and Fixtures",
  "5021321002": "R&M - Office Equipment",
  "5021321003": "R&M - ICT Equipment",
  "5021502000": "Fidelity Bond Premiums",
  "5021503000": "Insurance Expenses",
  "5029901000": "Advertising Expenses",
  "5029902000": "Printing and Publication Expenses",
  "5029903000": "Representation Expenses",
  "5029904000": "Transportation and Delivery Expenses",
  "5029905000": "Rent/Lease Expenses",
  "5029999099": "Other Maintenance and Operating Expenses",
  "5030104000": "Bank Charges",
};

const fmt = (n: number | string | undefined): string =>
  Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const parseCodeAndTitle = (rawObjectCode: string) => {
  if (!rawObjectCode) return { code: "—", title: "—" };
  let code = rawObjectCode.trim();
  let title = "";
  if (code.includes("—")) {
    const parts = code.split("—");
    code = parts[0].trim();
    title = parts[1]?.trim() || "";
  } else if (code.includes("-")) {
    const parts = code.split("-");
    code = parts[0].trim();
    title = parts[1]?.trim() || "";
  }
  if (!title) {
    title = OBJECT_CODE_MAP[code] || "General Operating Expense";
  }
  return { code, title };
};

export default function Page() {
  const initialRecords = getCachedMooeRecords();
  const [records, setRecords] = useState<MooeRecord[]>(initialRecords ?? []);
  const [loading, setLoading] = useState<boolean>(!initialRecords);
  const [selectedCY, setSelectedCY] = useState<string>(initialRecords?.[0]?.cy ?? "ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [lightboxList, setLightboxList] = useState<ReceiptItem[]>([]);
  const selectionInitialized = useRef(Boolean(initialRecords?.[0]?.cy));

  useEffect(() => {
    let active = true;

    const applyCachedRecords = () => {
      const cached = getCachedMooeRecords();
      if (!active || !cached) return;
      setRecords(cached);
      if (!selectionInitialized.current) {
        setSelectedCY(cached[0]?.cy ?? "ALL");
        selectionInitialized.current = true;
      }
      setLoading(false);
    };

    void fetchMooeRecords()
      .then(applyCachedRecords)
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Error loading public MOOE records:", error);
        setLoading(false);
      });

    const unsubscribe = subscribeToMooeRecords(applyCachedRecords);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const openLightbox = (receipts: ReceiptItem[], startIndex: number) => {
    setLightboxList(receipts);
    setLightboxIndex(startIndex);
    setLightboxUrl(receipts[startIndex].url);
  };

  const closeLightbox = () => {
    setLightboxUrl(null);
    setLightboxList([]);
    setLightboxIndex(0);
  };

  const navigateLightbox = (dir: number) => {
    const next = lightboxIndex + dir;
    if (next < 0 || next >= lightboxList.length) return;
    setLightboxIndex(next);
    setLightboxUrl(lightboxList[next].url);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxUrl) return;
      if (e.key === "Escape") closeLightbox();
      const direction = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!direction) return;
      const next = lightboxIndex + direction;
      if (next < 0 || next >= lightboxList.length) return;
      setLightboxIndex(next);
      setLightboxUrl(lightboxList[next].url);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxUrl, lightboxIndex, lightboxList]);

  const availableCYs: string[] = Array.from(
    new Set(records.map((r) => r.cy).filter((cy): cy is string => Boolean(cy)))
  ).sort((a, b) => b.localeCompare(a));

  const filteredRecords = records.filter((r) => {
    const matchCY = selectedCY === "ALL" || r.cy === selectedCY;
    const matchMonth = selectedMonth === "ALL" || r.month === selectedMonth;
    return matchCY && matchMonth;
  });

  const totalAllocation = filteredRecords.reduce((s, r) => s + (r.allocation || 0), 0);
  const totalExpenses = filteredRecords.reduce((s, r) => s + (r.total || 0), 0);
  const totalBalance = totalAllocation - totalExpenses;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-gray-900">
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-lg text-gray-700 font-semibold">
        <Link href="/" className="hover:text-blue-700 underline">Home</Link>
        <span>/</span>
        <span>MOOE Expenses & Liquidation</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b-2 border-gray-300">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight">
            MOOE Expenses & Liquidation
          </h1>
          <p className="text-gray-800 text-lg md:text-xl font-medium mt-2">
            Official monthly budget utilization and financial reports
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <label className="text-base font-bold text-gray-900 mb-1">Calendar Year</label>
            <select
              value={selectedCY}
              onChange={(e) => setSelectedCY(e.target.value)}
              className="border-2 border-gray-400 rounded-lg px-4 py-3 text-lg font-bold bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500"
            >
              <option value="ALL">All Calendar Years</option>
              {availableCYs.map((cy) => (
                <option key={cy} value={cy}>{cy}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-base font-bold text-gray-900 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border-2 border-gray-400 rounded-lg px-4 py-3 text-lg font-bold bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500"
            >
              <option value="ALL">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-24 text-center text-gray-800 text-2xl font-bold">
          Loading reports from Supabase...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-100 rounded-2xl border-2 border-dashed border-gray-400">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-black text-gray-900">No Records Found</h2>
          <p className="text-gray-700 text-base max-w-md mt-2 font-medium">
            There are no published MOOE liquidation reports for the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border-2 border-blue-200 bg-blue-50/80 shadow-sm">
              <span className="text-base font-black text-blue-900 uppercase tracking-wide">Total Allocation</span>
              <div className="text-3xl lg:text-4xl font-black text-blue-950 mt-2">₱{fmt(totalAllocation)}</div>
            </div>
            <div className="p-6 rounded-2xl border-2 border-amber-200 bg-amber-50/80 shadow-sm">
              <span className="text-base font-black text-amber-900 uppercase tracking-wide">Total Liquidated</span>
              <div className="text-3xl lg:text-4xl font-black text-amber-950 mt-2">₱{fmt(totalExpenses)}</div>
            </div>
            <div className="p-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 shadow-sm">
              <span className="text-base font-black text-emerald-900 uppercase tracking-wide">Unliquidated Balance</span>
              <div className="text-3xl lg:text-4xl font-black text-emerald-950 mt-2">₱{fmt(totalBalance)}</div>
            </div>
          </div>

          {/* Records */}
          <div className="space-y-8">
            {filteredRecords.map((r, i) => {
              const receipts = r.receipts || [];
              return (
                <div key={r.id || i} className="bg-white border-2 border-gray-300 rounded-2xl shadow-md overflow-hidden">

                  {/* High-Contrast Section Header */}
                  <div className="p-5 bg-gray-100 border-b-2 border-gray-300 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-2xl md:text-3xl font-black text-black tracking-tight">
                        {r.month} {r.cy?.replace(/^CY\s*/i, "")}
                      </span>
                    </div>
                    <div className="text-base md:text-lg text-gray-800 font-bold">
                      Liquidated by:{" "}
                      <span className="text-black font-black underline">{r.liquidated_by || r.liquidatedBy || "—"}</span>
                    </div>
                  </div>

                  {/* High-Legibility Expense Table */}
                  <div className="p-6 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-400 text-gray-900 font-black text-sm md:text-base uppercase tracking-wider bg-gray-50">
                          <th className="py-3 px-3 w-1/4">Account Code</th>
                          <th className="py-3 px-3 w-1/2">Account Title</th>
                          <th className="py-3 px-3 w-1/4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-gray-200 text-gray-900 text-base md:text-lg">
                        {(r.items || []).map((item, idx) => {
                          const { code, title } = parseCodeAndTitle(item.objectCode);
                          return (
                            <tr key={idx} className="hover:bg-yellow-50/50 transition-colors">
                              <td className="py-4 px-3 font-mono font-bold text-gray-900">{code}</td>
                              <td className="py-4 px-3 text-gray-900 font-semibold">{title}</td>
                              <td className="py-4 px-3 text-right font-black text-black">₱{fmt(item.amount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Clear Summary Footer */}
                  <div className="px-6 py-4 bg-gray-100 border-t-2 border-gray-300 flex flex-wrap items-center justify-between text-base md:text-lg font-black text-gray-900 gap-3">
                    <div>Allocation: <span className="text-black">₱{fmt(r.allocation)}</span></div>
                    <div>Expenses: <span className="text-amber-900">₱{fmt(r.total)}</span></div>
                    <div>Balance: <span className="text-emerald-900">₱{fmt(r.balance)}</span></div>
                  </div>

                  {/* Receipts Section */}
                  {receipts.length > 0 && (
                    <div className="px-6 py-5 border-t-2 border-gray-300 bg-gray-50">
                      <p className="text-base font-black text-gray-900 uppercase tracking-wider mb-4">
                        📎 Supporting Documents / Receipts ({receipts.length})
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {receipts.map((rec, idx) => (
                          <button
                            key={idx}
                            onClick={() => openLightbox(receipts, idx)}
                            className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-400 hover:border-blue-600 transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500"
                            title={`View receipt ${idx + 1}`}
                          >
                            <img
                              src={rec.url}
                              alt={`Receipt ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                              <span className="text-white text-2xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-5xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white text-4xl font-black hover:text-red-400 transition-colors"
              title="Close (Esc)"
            >
              ✕
            </button>

            <img
              src={lightboxUrl}
              alt="Receipt"
              className="max-h-[75vh] max-w-full rounded-xl shadow-2xl object-contain border-2 border-white"
            />

            {lightboxList.length > 1 && (
              <div className="mt-4 text-white text-xl font-black">
                {lightboxIndex + 1} / {lightboxList.length}
              </div>
            )}

            {lightboxList.length > 1 && (
              <div className="flex gap-6 mt-4">
                <button
                  onClick={() => navigateLightbox(-1)}
                  disabled={lightboxIndex === 0}
                  className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl text-lg font-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => navigateLightbox(1)}
                  disabled={lightboxIndex === lightboxList.length - 1}
                  className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-xl text-lg font-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
