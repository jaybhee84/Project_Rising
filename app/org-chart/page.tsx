/**
 * app/org-chart/page.tsx
 * Public org chart page for IECES Project Rising website.
 */

import { createClient } from "@supabase/supabase-js";

// Disable Next.js route caching so changes from Supabase show instantly
export const revalidate = 0;

// ─── 1. Interfaces & Types ───────────────────────────────────────────────────
interface StaffMember {
  id: string;
  family_name?: string;
  first_name?: string;
  middle_name?: string;
  category: "admin" | "teaching" | "non-teaching" | "job-order";
  admin_position?: string;
  teaching_position?: string;
  teaching_type?: string;
  is_designated?: boolean;
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
  "Head Teacher I",
  "Head Teacher II",
  "Head Teacher III",
  "Head Teacher IV",
  "Head Teacher V",
  "Head Teacher VI",
  "Administrative Officer II (AO II)",
  "Planning & Development Officer I (PDO I)",
  "Administrative Assistant III (Senior Bookkeeper)",
  "Administrative Assistant II (Disbursing Officer)",
  "Administrative Aide (Job Order)",
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

/**
 * Normalizes middle name down to middle initial with period (e.g. "R.")
 */
function getMiddleInitial(middleName?: string): string {
  if (!middleName || !middleName.trim()) return "";
  const cleaned = middleName.trim().replace(/\./g, "");
  const firstWord = cleaned.split(/\s+/)[0];
  if (!firstWord) return "";
  return `${firstWord.charAt(0).toUpperCase()}.`;
}

/**
 * Formats name as FIRST MIDDLE INITIAL FAMILY NAME with safety fallbacks
 */
function getDisplayName(person: StaffMember): string {
  const family = (person.family_name || "").trim().toUpperCase();
  const first = (person.first_name || "").trim().toUpperCase();
  const middleInit = getMiddleInitial(person.middle_name);

  // Fallback if one of the fields is missing
  if (!first && !family) return "UNNAMED STAFF";
  if (!first) return family;
  if (!family) return first;

  return `${first}${middleInit ? " " + middleInit : ""} ${family}`.trim();
}

function normalizedRole(person: StaffMember): string {
  return `${person.teaching_type || ""} ${person.admin_position || ""}`
    .trim()
    .toLowerCase();
}

function hasRole(person: StaffMember, terms: string[]): boolean {
  const role = normalizedRole(person);
  return terms.some((term) => role.includes(term));
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
  subtitle,
  positionOverride,
}: {
  person: StaffMember;
  highlight?: boolean;
  subtitle?: string;
  positionOverride?: string;
}) {
  const isSubstitute = person.status === "substitute";
  const displayName = getDisplayName(person);

  const positionTitle = positionOverride ||
    (person.category === "admin"
      ? person.is_designated
        ? `Designated ${person.admin_position || ""}`
        : person.admin_position || ""
      : person.category === "teaching"
      ? person.teaching_position || "Teacher I"
      : person.admin_position || "");
  const parentheticalStart = positionTitle.indexOf("(");
  const positionMain =
    parentheticalStart >= 0
      ? positionTitle.slice(0, parentheticalStart).trim()
      : positionTitle;
  const positionDetails =
    parentheticalStart >= 0
      ? positionTitle.slice(parentheticalStart).trim()
      : "";

  const roleLabel = subtitle ||
    (person.category === "teaching"
      ? person.teaching_type || null
      : null);

  const accentColor = highlight ? "#B8860B" : isSubstitute ? "#D97706" : "#7B1C1C";

  return (
    <div style={{ width: 200, height: 170, flexShrink: 0 }} className="relative">
      <div
        className="absolute inset-0 rounded-xl bg-white flex flex-col items-center"
        style={{
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          border: `2px solid ${accentColor}`,
        }}
      >
        {/* Badges */}
        {highlight && (
          <span
            className="absolute top-1.5 right-1.5 z-10 text-[0.48rem] font-black uppercase px-1.5 py-0.5 rounded-full leading-none"
            style={{ background: "#B8860B", color: "#fff" }}
          >
            ⭐ Chair
          </span>
        )}
        {isSubstitute && !highlight && (
          <span className="absolute top-1.5 right-1.5 z-10 bg-amber-500 text-white text-[0.48rem] font-bold uppercase px-1.5 py-0.5 rounded-full leading-none">
            SUB
          </span>
        )}

        {/* Circle photo */}
        <div
          className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            marginTop: 14,
            border: `2.5px solid ${accentColor}`,
            background: "#f1f5f9",
          }}
        >
          {person.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo_url}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            />
          ) : (
            <div style={{ fontSize: "2rem" }} className="select-none">👤</div>
          )}
        </div>

        {/* Text block */}
        <div className="flex flex-col items-center text-center px-2 mt-2" style={{ width: "100%" }}>
          {/* Name */}
          <div
            className="font-extrabold leading-tight w-full"
            title={displayName}
            style={{
              fontSize: "0.68rem",
              color: "#1e293b",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {displayName}
          </div>

          {/* Position title */}
          <div
            className="font-semibold leading-tight mt-0.5 w-full"
            style={{
              fontSize: "0.58rem",
              color: accentColor,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <span className="block">{positionMain}</span>
            {positionDetails && (
              <span className="block">{positionDetails}</span>
            )}
          </div>

          {/* Role label */}
          {roleLabel && (
            <div
              className="leading-tight mt-0.5 w-full truncate"
              style={{ fontSize: "0.52rem", color: "#64748b" }}
            >
              {roleLabel}
            </div>
          )}

          {/* Substitute expiry */}
          {isSubstitute && (
            <div
              className="mt-1 w-full text-center truncate rounded px-1 py-0.5"
              style={{
                fontSize: "0.47rem",
                color: "#92400e",
                background: "rgba(251,191,36,0.15)",
                border: "1px solid #fcd34d",
              }}
            >
              Until {formatSubDate(person.sub_expiry_end)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 6. Arrow Connector ───────────────────────────────────────────────────────
function ArrowDown({ height = 32 }: { height?: number }) {
  return (
    <svg
      width="20"
      height={height}
      viewBox={`0 0 20 ${height}`}
      className="block mx-auto flex-shrink-0"
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="arrowhead-down"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
        </marker>
      </defs>
      <line
        x1="10"
        y1="0"
        x2="10"
        y2={height - 4}
        stroke="#475569"
        strokeWidth="1.5"
        markerEnd="url(#arrowhead-down)"
      />
    </svg>
  );
}

function BranchConnector({
  childCount,
  childWidth = 160,
  gap = 12,
}: {
  childCount: number;
  childWidth?: number;
  gap?: number;
}) {
  if (childCount === 0) return null;

  const totalWidth = childCount * childWidth + (childCount - 1) * gap;
  const svgH = 40;
  const stemH = 16;
  const barY = stemH;

  const centers = Array.from({ length: childCount }, (_, i) =>
    i * (childWidth + gap) + childWidth / 2
  );

  const midX = totalWidth / 2;

  return (
    <svg
      width={totalWidth}
      height={svgH}
      viewBox={`0 0 ${totalWidth} ${svgH}`}
      className="block flex-shrink-0"
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="arrowhead-branch"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
        </marker>
      </defs>
      <line
        x1={midX}
        y1={0}
        x2={midX}
        y2={barY}
        stroke="#475569"
        strokeWidth="1.5"
      />
      {childCount > 1 && (
        <line
          x1={centers[0]}
          y1={barY}
          x2={centers[childCount - 1]}
          y2={barY}
          stroke="#475569"
          strokeWidth="1.5"
        />
      )}
      {centers.map((cx, i) => (
        <line
          key={i}
          x1={cx}
          y1={barY}
          x2={cx}
          y2={svgH - 4}
          stroke="#475569"
          strokeWidth="1.5"
          markerEnd="url(#arrowhead-branch)"
        />
      ))}
    </svg>
  );
}

// ─── 7. Main Page ────────────────────────────────────────────────────────────
export default async function DirectoryPage() {
  const allStaff = await getStaff();

  const substitutes = allStaff.filter((s) => s.status === "substitute");
  const activeStaff = allStaff.filter((s) => s.status !== "substitute");
  const districtSupervisor = activeStaff.find((s) =>
    hasRole(s, ["psds", "public schools district supervisor", "public school district supervisor"])
  );
  const alsCoordinators = activeStaff.filter((s) =>
    hasRole(s, ["als coordinator", "alternative learning system coordinator"])
  );
  const adminStaff = activeStaff.filter(
    (s) =>
      s.category === "admin" &&
      s.id !== districtSupervisor?.id &&
      !alsCoordinators.some((p) => p.id === s.id)
  );
  const teachingStaff = activeStaff.filter(
    (s) =>
      s.category === "teaching" &&
      s.id !== districtSupervisor?.id &&
      !alsCoordinators.some((p) => p.id === s.id)
  );
  const nonTeaching = activeStaff.filter(
    (s) => s.category === "non-teaching" || s.category === "job-order"
  );

  const alsTeachers = teachingStaff.filter((s) => hasRole(s, ["als"]));
  const aliveTeachers = teachingStaff.filter((s) => hasRole(s, ["alive"]));
  const subjectTeachers = teachingStaff.filter(
    (s) => !hasRole(s, ["als", "alive"]) && hasRole(s, ["subject"])
  );
  const teachingAdvisers = teachingStaff.filter(
    (s) => !hasRole(s, ["als", "alive", "subject"])
  );
  const watchmenAndUtility = nonTeaching.filter((s) =>
    hasRole(s, ["watchman", "watchmen", "security", "utility", "janitor", "custodian"])
  );
  const otherSupport = nonTeaching.filter(
    (s) => !watchmenAndUtility.some((p) => p.id === s.id)
  );

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
      s.admin_position === "Assistant Principal"
  );

  const otherAdmin = sortedAdmin.filter(
    (s) => s.id !== principal?.id && s.id !== vicePrincipal?.id
  );
  const primaryAlsCoordinator = alsCoordinators.find(
    (s) => normalizedRole(s) === "als coordinator"
  ) || alsCoordinators[0];
  const supportingAlsCoordinators = alsCoordinators.filter(
    (s) => s.id !== primaryAlsCoordinator?.id
  );
  const leadershipBranchCount = Number(Boolean(vicePrincipal || otherAdmin.length > 0)) +
    Number(Boolean(primaryAlsCoordinator));

  const isEmpty = allStaff.length === 0;

  const CARD_W = 200;
  const CARD_GAP = 12;

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-2 md:px-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-[#7B1C1C] uppercase tracking-wider">
          Isabela East Central Elementary School
        </h1>
        <p className="text-slate-600 font-bold text-sm tracking-wide">
          SDO Isabela City, Basilan
        </p>
        <h2 className="mt-5 text-xl md:text-2xl font-black text-slate-800 uppercase tracking-widest">
          Organizational Structure
        </h2>
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
            {/* 1. Administration Hierarchy */}
            {(districtSupervisor || sortedAdmin.length > 0 || alsCoordinators.length > 0) && (
              <section className="flex flex-col items-center">
                {districtSupervisor && (
                  <div className="flex flex-col items-center">
                    <StaffCard
                      person={districtSupervisor}
                      positionOverride="Public Schools District Supervisor (PSDS)"
                      subtitle="East District I"
                    />
                    {(principal || leadershipBranchCount > 0) && <ArrowDown height={32} />}
                  </div>
                )}

                {principal && (
                  <div className="flex flex-col items-center">
                    <StaffCard person={principal} />
                    {leadershipBranchCount > 0 && <ArrowDown height={32} />}
                  </div>
                )}

                {leadershipBranchCount > 0 && (
                  <div className="flex flex-col items-center">
                    <BranchConnector
                      childCount={leadershipBranchCount}
                      childWidth={CARD_W + 120}
                      gap={40}
                    />
                    <div className="flex items-start gap-10">
                      {(vicePrincipal || otherAdmin.length > 0) && (
                        <div className="flex min-w-[280px] flex-col items-center">
                          {vicePrincipal && <StaffCard person={vicePrincipal} />}
                          {vicePrincipal && otherAdmin.length > 0 && <ArrowDown height={32} />}
                          {otherAdmin.length > 0 && (
                            <>
                              {otherAdmin.length > 1 && (
                                <BranchConnector childCount={otherAdmin.length} childWidth={CARD_W} gap={CARD_GAP} />
                              )}
                              <div className="flex" style={{ gap: CARD_GAP }}>
                                {otherAdmin.map((person) => <StaffCard key={person.id} person={person} />)}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {primaryAlsCoordinator && (
                        <div className="flex min-w-[280px] flex-col items-center">
                          <StaffCard person={primaryAlsCoordinator} />
                          {supportingAlsCoordinators.length > 0 && <ArrowDown height={32} />}
                          {supportingAlsCoordinators.length > 1 && (
                            <BranchConnector childCount={supportingAlsCoordinators.length} childWidth={CARD_W} gap={CARD_GAP} />
                          )}
                          <div className="flex" style={{ gap: CARD_GAP }}>
                            {supportingAlsCoordinators.map((person) => (
                              <StaffCard key={person.id} person={person} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 2. Teaching Force */}
            {teachingStaff.length > 0 && (
              <section className="w-full pt-6 border-t-2 border-slate-300 overflow-x-auto pb-3">
                <h2 className="text-center text-lg font-black text-slate-800 uppercase tracking-wide mb-6">
                  Teaching Force
                </h2>

                <div className="grid w-max grid-cols-[234px_1718px_234px] gap-5 items-start">
                  <aside className="bg-white p-4 rounded-xl border border-slate-300">
                    <h3 className="text-center text-sm font-black uppercase text-[#7B1C1C] mb-4">Alternative Learning System (ALS)</h3>
                    <div className="flex flex-col items-center gap-3">
                      {alsTeachers.length > 0 ? alsTeachers.map((person) => (
                        <StaffCard key={person.id} person={person} />
                      )) : <p className="text-xs italic text-slate-400">Unassigned</p>}
                    </div>
                  </aside>

                  <div className="bg-white p-4 rounded-xl border border-slate-300">
                    <h3 className="text-center text-sm font-black uppercase text-slate-700 mb-4">Teaching Advisers</h3>
                    <div className="grid grid-cols-[repeat(8,200px)] gap-3">
                    {GRADE_LEVELS.map((gl) => {
                      const gradeTeachers = teachingAdvisers.filter(
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
                          className="flex min-w-[200px] flex-col items-center border-r last:border-r-0 border-slate-200 px-1"
                        >
                          <div className="w-full text-center py-1 px-1 bg-[#7B1C1C] text-white font-black text-[0.7rem] uppercase rounded mb-3 whitespace-nowrap">
                            {gl === "SPED" ? "SNED" : gl}
                          </div>

                          <div className="flex flex-col items-center w-full gap-0">
                            {gradeTeachers.length === 0 && (
                              <div className="text-[0.65rem] text-slate-400 text-center italic py-4 whitespace-nowrap">
                                Unassigned
                              </div>
                            )}

                            {chairman && (
                              <div className="flex flex-col items-center">
                                <StaffCard person={chairman} highlight={true} />
                              </div>
                            )}

                            {others.map((person, idx) => (
                              <div
                                key={person.id}
                                className="flex flex-col items-center"
                              >
                                {(chairman || idx > 0) && <ArrowDown height={28} />}
                                <StaffCard person={person} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    </div>

                    {subjectTeachers.length > 0 && (
                      <div className="mt-8 pt-5 border-t-2 border-slate-200">
                        <ArrowDown height={28} />
                        <h3 className="text-center text-sm font-black uppercase text-slate-700 mb-4">Subject Teachers</h3>
                        <div className="flex flex-wrap justify-center" style={{ gap: CARD_GAP }}>
                          {subjectTeachers.map((person) => (
                            <StaffCard key={person.id} person={person} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <aside className="bg-white p-4 rounded-xl border border-slate-300">
                    <h3 className="text-center text-sm font-black uppercase text-[#7B1C1C] mb-4">ALIVE</h3>
                    <div className="flex flex-col items-center gap-3">
                      {aliveTeachers.length > 0 ? aliveTeachers.map((person) => (
                        <StaffCard key={person.id} person={person} />
                      )) : <p className="text-xs italic text-slate-400">Unassigned</p>}
                    </div>
                  </aside>
                </div>
              </section>
            )}

            {/* 3. Substitute teachers */}
            {substitutes.length > 0 && (
              <section className="space-y-4 pt-6 border-t-2 border-slate-300">
                <h2 className="text-center text-lg font-black text-slate-800 uppercase tracking-wide">
                  Substitute Teachers
                </h2>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
                  <div className="flex flex-wrap justify-center" style={{ gap: CARD_GAP }}>
                    {substitutes.map((person) => (
                      <StaffCard key={person.id} person={person} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {otherSupport.length > 0 && (
              <section className="space-y-4 pt-6 border-t-2 border-slate-300">
                <h2 className="text-center text-lg font-black text-slate-800 uppercase tracking-wide">Support Staff</h2>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
                  <div className="flex flex-wrap justify-center" style={{ gap: CARD_GAP }}>
                    {otherSupport.map((person) => <StaffCard key={person.id} person={person} />)}
                  </div>
                </div>
              </section>
            )}

            {/* 4. Watchmen and utility workers stay at the bottom. */}
            {watchmenAndUtility.length > 0 && (
              <section className="space-y-4 pt-6 border-t-2 border-slate-300">
                <h2 className="text-center text-lg font-black text-slate-800 uppercase tracking-wide">Watchmen &amp; Utility Workers</h2>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
                  <div className="flex flex-wrap justify-center" style={{ gap: CARD_GAP }}>
                    {watchmenAndUtility.map((person) => <StaffCard key={person.id} person={person} />)}
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
