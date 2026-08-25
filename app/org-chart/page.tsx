/**
 * app/org-chart/page.tsx
 * Public org chart page for IECES Project Rising website.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import {
  fetchOrgChart,
  getCachedOrgChart,
  subscribeToOrgChart,
  type StaffMember,
} from "@/lib/orgChartData";

// ─── 1. Custom Hook for Click-and-Drag Scrolling ─────────────────────────────
function useDraggable<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      isDraggingRef.current = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
    };

    const handleMouseUp = () => {
      isDown = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;

      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;

      if (Math.abs(walk) > 5) {
        isDraggingRef.current = true;
        e.preventDefault();
        el.scrollLeft = scrollLeft - walk;
      }
    };

    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("mousemove", handleMouseMove);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return { ref, isDraggingRef };
}

// ─── 2. Interfaces & Types ───────────────────────────────────────────────────
// ─── 3. Constants ────────────────────────────────────────────────────────────
const ADMIN_ORDER = [
  "Principal",
  "Assistant Principal",
  "Head Teacher I",
  "Head Teacher II",
  "Head Teacher III",
  "Head Teacher IV",
  "Head Teacher V",
  "Head Teacher VI",
  "ALS Division Focal Person",
  "Education Program Specialist I (EPS I) ALS",
  "Administrative Officer II (AO II)",
  "Planning & Development Officer I (PDO I)",
  "Administrative Assistant III (Senior Bookkeeper)",
  "Administrative Assistant II (Disbursing Officer)",
  "Administrative Aide (Job Order)",
];

const GRADE_LEVELS = [
  "SNED",
  "Kinder",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

// ─── 4. Helper Functions ──────────────────────────────────────────────────────
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

function getMiddleInitial(middleName?: string): string {
  if (!middleName || !middleName.trim()) return "";
  const cleaned = middleName.trim().replace(/\./g, "");
  const firstWord = cleaned.split(/\s+/)[0];
  if (!firstWord) return "";
  return `${firstWord.charAt(0).toUpperCase()}.`;
}

function getDisplayName(person: StaffMember): string {
  const family = (person.family_name || "").trim().toUpperCase();
  const first = (person.first_name || "").trim().toUpperCase();
  const middleInit = getMiddleInitial(person.middle_name);

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

// ─── 5. Staff Card Component ──────────────────────────────────────────────────
function StaffCard({
  person,
  highlight = false,
  subtitle,
  positionOverride,
  onClick,
}: {
  person: StaffMember;
  highlight?: boolean;
  subtitle?: string;
  positionOverride?: string;
  onClick: () => void;
}) {
  const isSubstitute = person.status === "substitute";
  const displayName = getDisplayName(person);

  const positionTitle =
    positionOverride ||
    (person.category === "admin"
      ? person.is_designated
        ? `Designated ${person.admin_position || ""}`
        : person.admin_position || ""
      : person.category === "teaching"
      ? person.teaching_position || "Teacher I"
      : person.admin_position || "");

  const roleLabel =
    subtitle ||
    (person.category === "teaching" ? person.teaching_type || null : null);

  const borderAccent = highlight ? "#D97706" : isSubstitute ? "#D97706" : "#7B1C1C";
  const titleAccent = highlight ? "#B45309" : isSubstitute ? "#B45309" : "#7B1C1C";

  return (
    <div
      style={{ width: 152, height: 170, flexShrink: 0 }}
      className="relative z-10 hover:z-50 cursor-pointer group select-none pointer-events-auto"
      onClick={onClick}
    >
      <div
        className="absolute inset-0 rounded-xl bg-white flex flex-col items-center transition-all duration-300 ease-out group-hover:scale-125 group-hover:-translate-y-2 group-hover:shadow-2xl transform-gpu will-change-transform"
        style={{
          boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          border: `2.5px solid ${borderAccent}`,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {/* Badges */}
        {highlight && (
          <span
            className="absolute top-1.5 right-1.5 z-10 text-[0.48rem] font-black uppercase px-1.5 py-0.5 rounded-full leading-none shadow-md"
            style={{ background: "#D97706", color: "#ffffff" }}
          >
            ⭐ Chair
          </span>
        )}
        {isSubstitute && !highlight && (
          <span className="absolute top-1.5 right-1.5 z-10 bg-amber-600 text-white text-[0.48rem] font-black uppercase px-1.5 py-0.5 rounded-full leading-none shadow-md">
            SUB
          </span>
        )}

        {/* Circle photo */}
        <div
          className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
          style={{
            width: 80,
            height: 80,
            marginTop: 14,
            border: `2.5px solid ${borderAccent}`,
            background: "#f1f5f9",
          }}
        >
          {person.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo_url}
              alt={displayName}
              draggable={false}
              className="pointer-events-none select-none"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />
          ) : (
            <div style={{ fontSize: "2rem" }} className="select-none">
              👤
            </div>
          )}
        </div>

        {/* Text block */}
        <div
          className="flex flex-col items-center text-center px-2 mt-2 select-none"
          style={{ width: "100%" }}
        >
          <div
            className="font-black leading-tight w-full text-slate-900"
            style={{
              fontSize: "0.68rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {displayName}
          </div>

          <div
            className="font-black leading-tight mt-0.5 w-full"
            style={{
              fontSize: "0.58rem",
              color: titleAccent,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {positionTitle}
          </div>

          {roleLabel && (
            <div
              className="font-bold leading-tight mt-0.5 w-full truncate text-slate-600"
              style={{ fontSize: "0.52rem" }}
            >
              {roleLabel}
            </div>
          )}

          {isSubstitute && (
            <div
              className="mt-1 w-full text-center truncate rounded px-1 py-0.5 font-extrabold"
              style={{
                fontSize: "0.47rem",
                color: "#78350f",
                background: "#fef3c7",
                border: "1px solid #f59e0b",
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

// ─── 6. Full Screen View Modal ───────────────────────────────────────────────
function FullScreenModal({
  person,
  onClose,
}: {
  person: StaffMember;
  onClose: () => void;
}) {
  const displayName = getDisplayName(person);
  const isSubstitute = person.status === "substitute";

  const positionTitle =
    person.category === "admin"
      ? person.is_designated
        ? `Designated ${person.admin_position || ""}`
        : person.admin_position || ""
      : person.category === "teaching"
      ? person.teaching_position || "Teacher I"
      : person.admin_position || "";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full flex flex-col items-center text-center shadow-2xl border-4 border-[#D97706]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 text-2xl font-black bg-slate-100 hover:bg-slate-200 w-10 h-10 rounded-full flex items-center justify-center transition"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-[#7B1C1C] shadow-xl mb-6 bg-slate-100 flex items-center justify-center">
          {person.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.photo_url}
              alt={displayName}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="text-6xl select-none">👤</span>
          )}
        </div>

        <h2 className="text-xl md:text-3xl font-black text-slate-900 mb-2">
          {displayName}
        </h2>

        <p className="text-lg md:text-xl font-black text-[#7B1C1C] mb-1">
          {positionTitle}
        </p>

        {person.teaching_type && (
          <p className="text-md font-bold text-slate-600 mb-2">
            {person.teaching_type}
          </p>
        )}

        {person.grade_level && (
          <span className="inline-block bg-slate-200 text-slate-900 font-extrabold px-3 py-1 rounded-full text-sm mb-2 shadow-sm">
            {person.grade_level}{" "}
            {person.is_grade_chairman && "• Grade Chairman"}
          </span>
        )}

        {isSubstitute && (
          <div className="mt-2 bg-amber-100 border border-amber-400 text-amber-950 font-black text-xs px-3 py-1 rounded-full">
            Substitute Teacher (Until {formatSubDate(person.sub_expiry_end)})
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 bg-[#7B1C1C] hover:bg-[#5b1515] text-white font-black py-2.5 px-6 rounded-lg transition text-sm uppercase tracking-wider shadow-md"
        >
          Close View (Esc)
        </button>
      </div>
    </div>
  );
}

// ─── 7. Main Page Component ──────────────────────────────────────────────────
export default function DirectoryPage() {
  const initialStaff = getCachedOrgChart();
  const [allStaff, setAllStaff] = useState<StaffMember[]>(
    () => initialStaff?.filter((person) => !isExpired(person)) ?? [],
  );
  const [loading, setLoading] = useState(!initialStaff);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const { ref: scrollRef, isDraggingRef } = useDraggable<HTMLDivElement>();

  const handleCardClick = (person: StaffMember) => {
    if (!isDraggingRef.current) {
      setSelectedStaff(person);
    }
  };

  useEffect(() => {
    let active = true;

    const applyCachedStaff = () => {
      const cached = getCachedOrgChart();
      if (!active || !cached) return;
      setAllStaff(cached.filter((person) => !isExpired(person)));
      setLoading(false);
    };

    void fetchOrgChart()
      .then(applyCachedStaff)
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Error loading organizational chart:", error);
        setLoading(false);
      });

    const unsubscribe = subscribeToOrgChart(applyCachedStaff);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const substitutes = allStaff.filter((s) => s.status === "substitute");
  const activeStaff = allStaff.filter((s) => s.status !== "substitute");
  const districtSupervisor = activeStaff.find((s) =>
    hasRole(s, [
      "psds",
      "public schools district supervisor",
      "public school district supervisor",
    ])
  );
  const alsCoordinators = activeStaff.filter((s) =>
    hasRole(s, [
      "als coordinator",
      "alternative learning system coordinator",
    ])
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
    hasRole(s, [
      "watchman",
      "watchmen",
      "security",
      "utility",
      "janitor",
      "custodian",
    ])
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
    (s) => s.id !== principal?.id && s.admin_position === "Assistant Principal"
  );

  const otherAdmin = sortedAdmin.filter(
    (s) => s.id !== principal?.id && s.id !== vicePrincipal?.id
  );
  const primaryAlsCoordinator =
    alsCoordinators.find((s) => normalizedRole(s) === "als coordinator") ||
    alsCoordinators[0];
  const supportingAlsCoordinators = alsCoordinators.filter(
    (s) => s.id !== primaryAlsCoordinator?.id
  );

  const isEmpty = allStaff.length === 0;
  const CARD_GAP = 12;

  return (
    <div className="relative min-h-screen py-8 px-0 w-full overflow-x-hidden select-none">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105 filter blur-md pointer-events-none"
        style={{ backgroundImage: "url('/landmark.png')" }}
      />
      
      {/* Dark Overlay */}
      <div className="fixed inset-0 z-0 bg-black/40 pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full">
        {/* Header Block */}
        <div className="w-full text-center mb-10 px-4">
          <h1
            className="text-3xl md:text-5xl font-black text-[#F59E0B] uppercase tracking-wider mb-1"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.8)" }}
          >
            ORGANIZATIONAL CHART
          </h1>
          <h2
            className="text-xl md:text-2xl font-black text-amber-300 uppercase tracking-wide mb-1"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.8)" }}
          >
            Isabela East Central Elementary School
          </h2>
          <div className="inline-block bg-slate-900/80 backdrop-blur-md px-4 py-1 rounded-full border border-slate-700/80 shadow-lg">
            <p className="text-white font-black text-xs md:text-sm tracking-widest uppercase">
              Teaching and Non-Teaching Staff
            </p>
          </div>
        </div>

        <div className="w-full">
          {loading ? (
            <div className="text-center py-16">
              <span className="inline-block bg-slate-900/90 text-white font-black text-lg px-6 py-3 rounded-full shadow-2xl animate-pulse border border-slate-700">
                Loading directory...
              </span>
            </div>
          ) : isEmpty ? (
            <div className="text-center py-16 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/20 max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-lg font-black text-white">
                No directory entries found.
              </h2>
            </div>
          ) : (
            <div className="space-y-12 w-full">
              {/* 1. Administration Hierarchy */}
              {(districtSupervisor ||
                sortedAdmin.length > 0 ||
                alsCoordinators.length > 0) && (
                <section className="flex flex-col items-center w-full overflow-x-auto py-6 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-slate-800/60 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                  {districtSupervisor && (
                    <div className="flex flex-col items-center mb-6">
                      <StaffCard
                        person={districtSupervisor}
                        positionOverride="Public Schools District Supervisor (PSDS)"
                        subtitle="East District I"
                        onClick={() => setSelectedStaff(districtSupervisor)}
                      />
                    </div>
                  )}

                  {principal && (
                    <div className="flex flex-col items-center mb-6">
                      <StaffCard
                        person={principal}
                        onClick={() => setSelectedStaff(principal)}
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center items-start gap-10">
                    {(vicePrincipal || otherAdmin.length > 0) && (
                      <div className="flex flex-col items-center gap-4">
                        {vicePrincipal && (
                          <StaffCard
                            person={vicePrincipal}
                            onClick={() => setSelectedStaff(vicePrincipal)}
                          />
                        )}
                        {otherAdmin.length > 0 && (
                          <div
                            className="flex flex-wrap justify-center"
                            style={{ gap: CARD_GAP }}
                          >
                            {otherAdmin.map((person) => (
                              <StaffCard
                                key={person.id}
                                person={person}
                                onClick={() => setSelectedStaff(person)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {primaryAlsCoordinator && (
                      <div className="flex flex-col items-center gap-4">
                        <StaffCard
                          person={primaryAlsCoordinator}
                          onClick={() => setSelectedStaff(primaryAlsCoordinator)}
                        />
                        <div
                          className="flex flex-wrap justify-center"
                          style={{ gap: CARD_GAP }}
                        >
                          {supportingAlsCoordinators.map((person) => (
                            <StaffCard
                              key={person.id}
                              person={person}
                              onClick={() => setSelectedStaff(person)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 2. Teaching Force */}
              {teachingStaff.length > 0 && (
                <section className="w-full pt-8 border-t-2 border-amber-500/50">
                  <div className="text-center mb-6 px-4">
                    <span className="inline-block bg-slate-900/90 text-amber-400 border border-amber-500/40 text-lg font-black uppercase tracking-wider px-6 py-1.5 rounded-full shadow-lg">
                      Teaching Force
                    </span>
                  </div>

                  {/* Translucent Glass Container with Visible Scrollbar */}
                  <div
                    ref={scrollRef}
                    className="bg-slate-900/40 backdrop-blur-md p-6 rounded-none border-y-2 border-white/20 w-full overflow-x-auto shadow-2xl cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-slate-800/60 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
                  >
                    <div className="flex items-start min-w-[1640px] w-full py-4">
                      {/* ALS Column */}
                      <div className="flex flex-col items-center px-3 w-[180px] flex-shrink-0">
                        <div className="w-full text-center py-1.5 px-1 bg-[#7B1C1C] text-white font-black text-xs uppercase rounded-md mb-3 whitespace-nowrap shadow-md border border-red-500/30">
                          ALS
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          {alsTeachers.length > 0 ? (
                            alsTeachers.map((person) => (
                              <StaffCard
                                key={person.id}
                                person={person}
                                onClick={() => handleCardClick(person)}
                              />
                            ))
                          ) : (
                            <div className="text-xs font-black text-amber-200/80 text-center italic py-4 whitespace-nowrap drop-shadow">
                              Unassigned
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 8 Grade Level Columns */}
                      <div className="grid grid-cols-8 gap-2 flex-grow px-1">
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
                              className="flex flex-col items-center px-1"
                            >
                              <div className="w-full text-center py-1.5 px-1 bg-[#7B1C1C] text-white font-black text-xs uppercase rounded-md mb-3 whitespace-nowrap shadow-md border border-red-500/30">
                                {gl}
                              </div>

                              <div className="flex flex-col items-center w-full gap-4">
                                {gradeTeachers.length === 0 && (
                                  <div className="text-xs font-black text-amber-200/80 text-center italic py-4 whitespace-nowrap drop-shadow">
                                    Unassigned
                                  </div>
                                )}

                                {chairman && (
                                  <StaffCard
                                    person={chairman}
                                    highlight={true}
                                    onClick={() => handleCardClick(chairman)}
                                  />
                                )}

                                {others.map((person) => (
                                  <StaffCard
                                    key={person.id}
                                    person={person}
                                    onClick={() => handleCardClick(person)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ALIVE Column */}
                      <div className="flex flex-col items-center px-3 w-[180px] flex-shrink-0">
                        <div className="w-full text-center py-1.5 px-1 bg-[#7B1C1C] text-white font-black text-xs uppercase rounded-md mb-3 whitespace-nowrap shadow-md border border-red-500/30">
                          ALIVE
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          {aliveTeachers.length > 0 ? (
                            aliveTeachers.map((person) => (
                              <StaffCard
                                key={person.id}
                                person={person}
                                onClick={() => handleCardClick(person)}
                              />
                            ))
                          ) : (
                            <div className="text-xs font-black text-amber-200/80 text-center italic py-4 whitespace-nowrap drop-shadow">
                              Unassigned
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subject Teachers */}
                    {subjectTeachers.length > 0 && (
                      <div className="mt-8 pt-6 border-t-2 border-white/20 py-4">
                        <h3 className="text-center text-sm font-black uppercase text-amber-300 mb-4 tracking-wide drop-shadow">
                          Subject Teachers
                        </h3>
                        <div
                          className="flex flex-wrap justify-center"
                          style={{ gap: CARD_GAP }}
                        >
                          {subjectTeachers.map((person) => (
                            <StaffCard
                              key={person.id}
                              person={person}
                              onClick={() => handleCardClick(person)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* 3. Substitute teachers */}
              {substitutes.length > 0 && (
                <section className="space-y-4 pt-8 border-t-2 border-amber-500/50 w-full">
                  <div className="text-center px-4">
                    <span className="inline-block bg-slate-900/90 text-amber-400 border border-amber-500/40 text-lg font-black uppercase tracking-wider px-6 py-1.5 rounded-full shadow-lg">
                      Substitute Teachers
                    </span>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-none border-y-2 border-white/20 shadow-2xl py-6 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-slate-800/60 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    <div
                      className="flex flex-wrap justify-center"
                      style={{ gap: CARD_GAP }}
                    >
                      {substitutes.map((person) => (
                        <StaffCard
                          key={person.id}
                          person={person}
                          onClick={() => handleCardClick(person)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Support Staff */}
              {otherSupport.length > 0 && (
                <section className="space-y-4 pt-8 border-t-2 border-amber-500/50 w-full">
                  <div className="text-center px-4">
                    <span className="inline-block bg-slate-900/90 text-amber-400 border border-amber-500/40 text-lg font-black uppercase tracking-wider px-6 py-1.5 rounded-full shadow-lg">
                      Support Staff
                    </span>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-none border-y-2 border-white/20 shadow-2xl py-6 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-slate-800/60 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    <div
                      className="flex flex-wrap justify-center"
                      style={{ gap: CARD_GAP }}
                    >
                      {otherSupport.map((person) => (
                        <StaffCard
                          key={person.id}
                          person={person}
                          onClick={() => handleCardClick(person)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* 4. Watchmen & Utility */}
              {watchmenAndUtility.length > 0 && (
                <section className="space-y-4 pt-8 border-t-2 border-amber-500/50 w-full">
                  <div className="text-center px-4">
                    <span className="inline-block bg-slate-900/90 text-amber-400 border border-amber-500/40 text-lg font-black uppercase tracking-wider px-6 py-1.5 rounded-full shadow-lg">
                      Watchmen &amp; Utility Workers
                    </span>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-none border-y-2 border-white/20 shadow-2xl py-6 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-track]:bg-slate-800/60 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    <div
                      className="flex flex-wrap justify-center"
                      style={{ gap: CARD_GAP }}
                    >
                      {watchmenAndUtility.map((person) => (
                        <StaffCard
                          key={person.id}
                          person={person}
                          onClick={() => handleCardClick(person)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Modal */}
      {selectedStaff && (
        <FullScreenModal
          person={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}
    </div>
  );
}
