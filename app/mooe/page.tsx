"use client";

import React, { useState, useEffect } from "react";
import { supabase, MOOE_TABLE } from "@/lib/supabase";

interface ExpenseItem {
  objectCode: string;
  amount: number;
}

interface MooeRecord {
  id?: string;
  cy?: string;
  sy?: string;
  month: string;
  allocation: number;
  total: number;
  balance: number;
  items: ExpenseItem[];
  liquidated_by?: string;
  liquidatedBy?: string;
  date_received?: string;
  date_liquidated?: string;
  remarks?: string;
}

const MONTHS: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// COA / DepEd UACS Code Title Lookup Map
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

// Helper to separate code and title
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
  const [records, setRecords] = useState<MooeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCY, setSelectedCY] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  useEffect(() => {
    fetchPublicRecords();
  }, []);

  const fetchPublicRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(MOOE_TABLE).select("*");

    if (error) {
      console.error("Error loading public MOOE records:", error);
      setLoading(false);
      return;
    }

    const formattedData: MooeRecord[] = (data || []).map((r: MooeRecord) => ({
      ...r,
      cy: r.cy || r.sy || "CY 2026",
    }));

    const sorted = formattedData.sort((a, b) => {
      if (a.cy !== b.cy) {
        return (b.cy || "").localeCompare(a.cy || "");
      }
      return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
    });

    setRecords(sorted);

    if (sorted.length > 0 && sorted[0].cy) {
      setSelectedCY(sorted[0].cy);
    }

    setLoading(false);
  };

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
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <a href="/" className="hover:text-blue-600">
          Home
        </a>
        <span>/</span>
        <span>MOOE Expenses & Liquidation</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl font-black"
            style={{ color: "var(--deped-blue, #003366)" }}
          >
            MOOE Expenses & Liquidation
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Official monthly budget utilization and financial reports
          </p>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">
              Calendar Year
            </label>
            <select
              value={selectedCY}
              onChange={(e) => setSelectedCY(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Calendar Years</option>
              {availableCYs.map((cy) => (
                <option key={cy} value={cy}>
                  {cy}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 text-sm">
          Loading reports from Supabase...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-base font-bold text-gray-700">No Records Found</h2>
          <p className="text-gray-500 text-xs max-w-xs mt-1">
            There are no published MOOE liquidation reports for the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border bg-blue-50 border-blue-100">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Total Allocation
              </span>
              <div className="text-xl font-bold text-blue-900 mt-1">
                ₱{fmt(totalAllocation)}
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-amber-50 border-amber-100">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Total Liquidated
              </span>
              <div className="text-xl font-bold text-amber-900 mt-1">
                ₱{fmt(totalExpenses)}
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-100">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Unliquidated Balance
              </span>
              <div className="text-xl font-bold text-emerald-900 mt-1">
                ₱{fmt(totalBalance)}
              </div>
            </div>
          </div>

          {/* List of Reports */}
          <div className="space-y-4">
            {filteredRecords.map((r, i) => (
              <div
                key={r.id || i}
                className="bg-white border rounded-xl shadow-sm overflow-hidden"
              >
                {/* Header Info */}
                <div className="p-4 bg-gray-50 border-b flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {r.cy}
                    </span>
                    <span className="text-base font-bold text-gray-800">
                      {r.month}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Liquidated by:{" "}
                    <b className="text-gray-700">
                      {r.liquidated_by || r.liquidatedBy || "—"}
                    </b>
                  </div>
                </div>

                {/* 3-Column Table: Account Code | Account Title | Amount */}
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-gray-400 font-semibold uppercase">
                        <th className="pb-2 w-1/4">ACCOUNT CODE</th>
                        <th className="pb-2 w-1/2">ACCOUNT TITLE</th>
                        <th className="pb-2 w-1/4 text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700">
                      {(r.items || []).map((item, idx) => {
                        const { code, title } = parseCodeAndTitle(item.objectCode);

                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2.5 font-mono text-gray-800 font-medium">
                              {code}
                            </td>
                            <td className="py-2.5 text-gray-600 font-normal">
                              {title}
                            </td>
                            <td className="py-2.5 text-right font-medium text-gray-900">
                              ₱{fmt(item.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Totals */}
                <div className="px-4 py-3 bg-gray-50/50 border-t flex flex-wrap items-center justify-between text-xs font-medium text-gray-600">
                  <div>
                    Allocation: <b>₱{fmt(r.allocation)}</b>
                  </div>
                  <div>
                    Expenses: <b className="text-amber-700">₱{fmt(r.total)}</b>
                  </div>
                  <div>
                    Balance: <b className="text-emerald-700">₱{fmt(r.balance)}</b>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}