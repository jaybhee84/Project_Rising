"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

interface Student {
  id: string;
  grade_level: string | number;
  gender?: string;
  is_4ps?: boolean;
  is_4ps_beneficiary?: boolean;
  reading_level?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_ENROLLMENT_SUPABASE_URL || "https://joilvslvsioayrjshuxg.supabase.co",
  process.env.NEXT_PUBLIC_ENROLLMENT_SUPABASE_ANON_KEY || "sb_publishable_aozkBamT5C58KY03X9kUgA_iehy73ZU"
);

const GRADE_LEVELS = [
  { key: "0", label: "Kinder" },
  { key: "1", label: "Grade 1" },
  { key: "2", label: "Grade 2" },
  { key: "3", label: "Grade 3" },
  { key: "4", label: "Grade 4" },
  { key: "5", label: "Grade 5" },
  { key: "6", label: "Grade 6" },
  { key: "SNED", label: "SNED" },
];

export default function EnrollmentPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      const result = await supabase.from("students").select(
        "id, grade_level, gender, is_4ps, is_4ps_beneficiary, reading_level"
      );
      if (!active) return;
      if (result.error) setError(result.error.message);
      else setStudents((result.data as Student[]) || []);
      setLoading(false);
    }

    loadStudents();
    const channel = supabase
      .channel("public:enrollment-summary")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, loadStudents)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const rows = useMemo(() => GRADE_LEVELS.map((grade) => {
    const gradeStudents = students.filter((student) =>
      String(student.grade_level).toUpperCase() === grade.key
    );
    const male = gradeStudents.filter((student) => student.gender?.toLowerCase() === "male").length;
    const female = gradeStudents.filter((student) => student.gender?.toLowerCase() === "female").length;
    const beneficiaries = gradeStudents.filter(
      (student) => student.is_4ps || student.is_4ps_beneficiary
    ).length;
    return { ...grade, male, female, beneficiaries, total: gradeStudents.length };
  }), [students]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-[#7B1C1C]">← Home</Link>
          <h1 className="mt-3 text-3xl font-black text-[#7B1C1C]">Enrollment Data</h1>
          <p className="mt-2 text-sm text-slate-500">Live public summary from the IECES enrollment portal.</p>
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white p-12 text-center text-slate-500">Loading enrollment data…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">Unable to load enrollment data: {error}</div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Enrollment Summary</h2>
                <p className="text-xs text-slate-500">Counts update when records change in the portal.</p>
              </div>
              <div className="rounded-xl bg-[#7B1C1C] px-5 py-3 text-center text-white">
                <div className="text-2xl font-black">{students.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider">Total Learners</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-xs uppercase text-slate-600">
                    <th className="border p-3 text-left">Grade level</th>
                    <th className="border p-3 text-center">Male</th>
                    <th className="border p-3 text-center">Female</th>
                    <th className="border p-3 text-center">4Ps beneficiaries</th>
                    <th className="border p-3 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50">
                      <td className="border p-3 font-bold text-slate-700">{row.label}</td>
                      <td className="border p-3 text-center text-blue-700">{row.male}</td>
                      <td className="border p-3 text-center text-pink-700">{row.female}</td>
                      <td className="border p-3 text-center">{row.beneficiaries}</td>
                      <td className="border p-3 text-center font-black">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
