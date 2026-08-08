/**
 * app/org-chart/page.tsx
 * Public org chart page for IECES Project Rising website.
 */

import { createClient } from "@supabase/supabase-js";

// ─── 1. Interfaces & Types ───────────────────────────────────────────────────
interface StaffMember {
  id: string;
  name: string;
  category: "admin" | "teaching" | "non-teaching";
  admin_position?: string;
  teaching_type?: string;
  grade_level?: string;
  is_grade_chairman?: boolean;
  status: "alive" | "substitute";
  sub_expiry_start?: string;
  sub_expiry_end?: string;
  photo_url?: string;
}

// ─── 2. Constants ────────────────────────────────────────────────────────────
const ADMIN_ORDER = [
  "Principal",
  "Assistant Principal",
  "Designated Assistant Principal",
  "Administrative Officer (AO)",
  "Planning & Development Officer (PDO)",
  "ADAS III",
  "ADAS II",
  "Admin Aide (Job Order)",
];

const GRADE_LEVELS = [
  "SPED",
  "Kinder",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

// ─── 3. Helper Functions ──────────────────────────────────────────────────────
function isExpired(person: StaffMember): boolean {
  if (person.status !== "substitute" || !person.sub_expiry_end) return false;
  const expiry = new Date(person.sub_expiry_end + "T23:59:59");
  return new Date() > expiry;
}

function formatSubDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── 4. Data Fetching ────────────────────────────────────────────────────────
async function getStaff(): Promise<StaffMember[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from("org_chart")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as StaffMember[]).filter((p) => !isExpired(p));
}

// ─── 5. Staff Card Component ──────────────────────────────────────────────────
function StaffCard({
  person,
  highlight = false,
}: {
  person: StaffMember;
  highlight?: boolean;
}) {
  const isSubstitute = person.status === "substitute";

  // Priority resolution for position titles (e.g., Teacher VI)
  const positionTitle =
    person.admin_position ||
    person.teaching_type ||
    "Class Adviser";

  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-lg border-2 shadow-xs text-center bg-white transition-all w-full min-h-[130px] justify-between ${
        highlight
          ? "border-amber-400 bg-amber-50/40"
          : isSubstitute
          ? "border-amber-300"
          : "border-[#7B1C1C]/40 hover:border-[#7B1C1C]"
      }`}
    >
      {/* Badges */}
      {highlight && (
        <span className="absolute -top-2.5 bg-amber-400 text-slate-900 text-[0.55rem] font-black uppercase px-1.5 py-0.5 rounded-full shadow-xs z-10 whitespace-nowrap">
          ⭐ Chairman
        </span>
      )}
      {isSubstitute && !highlight && (
        <span className="absolute -top-2.5 bg-amber-500 text-white text-[0.55rem] font-bold uppercase px-1.5 py-0.5 rounded-full shadow-xs z-10 whitespace-nowrap">
          SUB
        </span>
      )}

      {/* Photo Container */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 mt-1 flex items-center justify-center">
        {person.photo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={person.photo_url}
            alt={person.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-slate-400 text-lg">👤</div>
        )}
      </div>

      {/* Text Info */}
      <div className="flex flex-col items-center mt-1.5 w-full">
        {/* Single-line Name */}
        <div className="font-extrabold text-slate-800 text-[0.75rem] leading-snug whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1">
          {person.name}
        </div>

        {/* Teaching / Admin Position */}
        <div className="text-[0.65rem] text-slate-600 font-medium leading-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-1">
          {positionTitle}
        </div>

        {/* Substitute Expiry */}
        {isSubstitute && (
          <div className="mt-1 text-[0.55rem] text-amber-800 bg-amber-100/70 px-1 py-0.5 rounded border border-amber-200 whitespace-nowrap">
            Until {formatSubDate(person.sub_expiry_end)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 6. Main Page ────────────────────────────────────────────────────────────
export default async function DirectoryPage() {
  const allStaff = await getStaff();

  const adminStaff = allStaff.filter((s) => s.category === "admin");
  const teachingStaff = allStaff.filter((s) => s.category === "teaching");
  const nonTeaching = allStaff.filter((s) => s.category === "non-teaching");

  const sortedAdmin = [...adminStaff].sort((a, b) => {
    const ai = ADMIN_ORDER.indexOf(a.admin_position || "");
    const bi = ADMIN_ORDER.indexOf(b.admin_position || "");
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const principal = sortedAdmin.find(
    (s) =>
      s.admin_position?.toLowerCase().includes("principal") &&
      !s.admin_position?.toLowerCase().includes("asst") &&
      !s.admin_position?.toLowerCase().includes("assistant") &&
      !s.admin_position?.toLowerCase().includes("designated")
  );

  const vicePrincipal = sortedAdmin.find(
    (s) =>
      s.id !== principal?.id &&
      (s.admin_position?.toLowerCase().includes("assistant principal") ||
        s.admin_position?.toLowerCase().includes("designated assistant"))
  );

  const otherAdmin = sortedAdmin.filter(
    (s) => s.id !== principal?.id && s.id !== vicePrincipal?.id
  );

  const leftAdmin = otherAdmin.filter((_, index) => index % 2 === 0);
  const rightAdmin = otherAdmin.filter((_, index) => index % 2 !== 0);

  const isEmpty = allStaff.length === 0;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-2 md:px-6">
      <div className="max-w-[1600px] mx-auto text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-[#7B1C1C] uppercase tracking-wider">
          Isabela East Central Elementary School
        </h1>
        <p className="text-slate-600 font-bold text-sm tracking-wide">
          SDO Isabela City, Basilan — Organizational Structure
        </p>
      </div>

      <div className="max-w-[1600px] mx-auto">
        {isEmpty ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-300">
            <h2 className="text-lg font-bold text-slate-700">
              No directory entries found.
            </h2>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 1. Administration Hierarchy Tree */}
            {sortedAdmin.length > 0 && (
              <section className="flex flex-col items-center">
                {principal && (
                  <div className="relative min-w-[180px]">
                    <StaffCard person={principal} />
                    <div className="w-0.5 h-6 bg-slate-700 mx-auto" />
                  </div>
                )}

                {vicePrincipal && (
                  <div className="relative min-w-[180px]">
                    <StaffCard person={vicePrincipal} />
                  </div>
                )}

                {otherAdmin.length > 0 && (
                  <div className="relative flex flex-col items-center w-full max-w-3xl mt-0">
                    <div className="w-0.5 h-6 bg-slate-700" />
                    <div className="relative w-full flex flex-col items-center">
                      <div className="absolute top-0 bottom-0 w-0.5 bg-slate-700 left-1/2 -translate-x-1/2" />
                      <div className="w-full space-y-4 py-2">
                        {Array.from({
                          length: Math.max(leftAdmin.length, rightAdmin.length),
                        }).map((_, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center w-full relative"
                          >
                            <div className="w-[45%] flex justify-end items-center relative">
                              {leftAdmin[i] ? (
                                <>
                                  <div className="min-w-[180px]">
                                    <StaffCard person={leftAdmin[i]} />
                                  </div>
                                  <div className="h-0.5 bg-slate-700 flex-1 ml-2" />
                                </>
                              ) : (
                                <div />
                              )}
                            </div>

                            <div className="w-[45%] flex justify-start items-center relative">
                              {rightAdmin[i] ? (
                                <>
                                  <div className="h-0.5 bg-slate-700 flex-1 mr-2" />
                                  <div className="min-w-[180px]">
                                    <StaffCard person={rightAdmin[i]} />
                                  </div>
                                </>
                              ) : (
                                <div />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 2. Single-Row Teaching Force Layout */}
            {teachingStaff.length > 0 && (
              <section className="pt-6 border-t-2 border-slate-300 overflow-x-auto">
                <h2 className="text-center text-lg font-black text-slate-800 uppercase tracking-wide mb-6">
                  Teaching Force
                </h2>

                <div className="grid grid-cols-8 gap-3 min-w-[1300px] bg-white p-4 rounded-xl border border-slate-300">
                  {GRADE_LEVELS.map((gl) => {
                    const gradeTeachers = teachingStaff.filter(
                      (t) => t.grade_level === gl
                    );

                    const chairman = gradeTeachers.find(
                      (t) => t.is_grade_chairman
                    );
                    const others = gradeTeachers.filter(
                      (t) => t.id !== chairman?.id
                    );

                    return (
                      <div
                        key={gl}
                        className="flex flex-col items-center border-r last:border-r-0 border-slate-200 px-1"
                      >
                        {/* Grade Header */}
                        <div className="w-full text-center py-1 px-1 bg-[#7B1C1C] text-white font-black text-[0.7rem] uppercase rounded mb-3 whitespace-nowrap">
                          {gl}
                        </div>

                        {/* Teachers Column */}
                        <div className="w-full space-y-3">
                          {/* Chairman on top */}
                          {chairman && (
                            <StaffCard person={chairman} highlight={true} />
                          )}

                          {/* Regular Teachers below */}
                          {others.map((person) => (
                            <StaffCard key={person.id} person={person} />
                          ))}

                          {gradeTeachers.length === 0 && (
                            <div className="text-[0.65rem] text-slate-400 text-center italic py-4 whitespace-nowrap">
                              Unassigned
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. Non-Teaching Staff Grid */}
            {nonTeaching.length > 0 && (
              <section className="space-y-4 pt-6 border-t-2 border-slate-300">
                <h2 className="text-center text-lg font-black text-slate-800 uppercase tracking-wide">
                  Non-Teaching Staff
                </h2>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-xs">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {nonTeaching.map((person) => (
                      <div key={person.id} className="min-w-[180px]">
                        <StaffCard person={person} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}