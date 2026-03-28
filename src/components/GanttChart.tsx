"use client";

import { useMemo, useState } from "react";
import type { Profile, Project } from "@/types";
import * as HolidayJp from "@holiday-jp/holiday_jp";
import ProjectDetail from "./ProjectDetail";
import ProjectForm from "./ProjectForm";

type ViewMode = "1M" | "3M" | "6M" | "12M";

const PROJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#f97316", "#22c55e",
  "#ec4899", "#14b8a6", "#eab308", "#ef4444",
  "#06b6d4", "#a855f7", "#84cc16", "#f43f5e",
];

const DOW_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

function sod(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function mondayOf(d: Date) {
  const dow = d.getDay();
  return addDays(sod(d), -(dow === 0 ? 6 : dow - 1));
}
function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

type Bar = {
  project: Project;
  start: Date;
  end: Date;
  label: string;
  color: string;
  milestones: { date: Date; type: string }[];
};

type Props = {
  members: Profile[];
  projects: Project[];
  currentUserId: string;
  isAdmin: boolean;
};

export default function GanttChart({ members, projects, currentUserId, isAdmin }: Props) {
  const today = sod(new Date());
  const [view, setView] = useState<ViewMode>("12M");
  const [offset, setOffset] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const months = useMemo(() => {
    const result: Date[] = [];
    let start: Date;
    let count: number;
    if (view === "12M") {
      start = new Date(today.getFullYear(), today.getMonth() - 3 + offset * 12, 1);
      count = 12;
    } else if (view === "6M") {
      start = new Date(today.getFullYear(), today.getMonth() + offset * 6, 1);
      count = 6;
    } else if (view === "3M") {
      start = new Date(today.getFullYear(), today.getMonth() + offset * 3, 1);
      count = 3;
    } else {
      start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      count = 1;
    }
    for (let i = 0; i < count; i++) {
      result.push(new Date(start.getFullYear(), start.getMonth() + i, 1));
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, offset]);

  const visibleMembers = isAdmin
    ? members
    : members.filter((m) => m.id === currentUserId);

  const memberNameMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members]
  );

  // Assign a stable color to each project by its position in sorted order
  const projectColorMap = useMemo(() => {
    const sorted = [...projects].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return Object.fromEntries(
      sorted.map((p, i) => [p.id, PROJECT_COLORS[i % PROJECT_COLORS.length]])
    );
  }, [projects]);

  const allBars = useMemo((): Bar[] => {
    const bars: Bar[] = [];
    const addProject = (p: Project) => {
      if (!visibleMembers.find((m) => m.id === p.member_id)) return;
      if (!p.start_date && !p.delivery_date) return;
      const start = p.start_date ? sod(new Date(p.start_date)) : null;
      const end = p.delivery_date ? sod(new Date(p.delivery_date)) : null;
      const memberName = memberNameMap[p.member_id] ?? "";
      bars.push({
        project: p,
        start: start ?? end!,
        end: end ?? start!,
        label: isAdmin && memberName ? `${memberName}｜${p.name}` : p.name,
        color: p.color ?? projectColorMap[p.id] ?? PROJECT_COLORS[0],
        milestones: (p.milestones ?? [])
          .filter((m) => m.date)
          .map((m) => ({ date: sod(new Date(m.date)), type: m.type }))
          .sort((a, b) => a.date.getTime() - b.date.getTime()),
      });
    };
    for (const p of projects) {
      addProject(p);
      for (const child of p.children ?? []) addProject(child);
    }
    return bars.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [projects, visibleMembers, memberNameMap, projectColorMap, isAdmin]);

  const compact = view === "12M";
  const showMilestoneLabels = view === "1M" || view === "3M";
  const gridCols = view === "12M" ? 3 : view === "6M" ? 2 : 1;

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1">
          {(["1M", "3M", "6M", "12M"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setOffset(0); }}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                view === v ? "bg-slate-700 text-slate-200" : "border border-slate-700 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset((o) => o - 1)} className="px-3 py-1 border border-slate-700 text-slate-400 rounded hover:bg-slate-800 hover:text-slate-200 text-sm transition-colors">◀</button>
          <button onClick={() => setOffset(0)} className="px-3 py-1 border border-slate-700 text-slate-500 rounded hover:bg-slate-800 hover:text-slate-300 text-sm transition-colors">今日</button>
          <button onClick={() => setOffset((o) => o + 1)} className="px-3 py-1 border border-slate-700 text-slate-400 rounded hover:bg-slate-800 hover:text-slate-200 text-sm transition-colors">▶</button>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {months.map((month) => (
          <MonthCalendar
            key={`${month.getFullYear()}-${month.getMonth()}`}
            month={month}
            today={today}
            bars={allBars}
            compact={compact}
            showMilestoneLabels={showMilestoneLabels}
            onSelectProject={setSelectedProject}
          />
        ))}
      </div>

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          memberName={memberNameMap[selectedProject.member_id] ?? ""}
          color={projectColorMap[selectedProject.id] ?? PROJECT_COLORS[0]}
          onEdit={() => { setEditingProject(selectedProject); setSelectedProject(null); }}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {editingProject && (
        <ProjectForm
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

function MonthCalendar({
  month, today, bars, compact, showMilestoneLabels, onSelectProject,
}: {
  month: Date;
  today: Date;
  bars: Bar[];
  compact: boolean;
  showMilestoneLabels: boolean;
  onSelectProject: (p: Project) => void;
}) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const lastDay = new Date(y, m + 1, 0);
  const start = mondayOf(new Date(y, m, 1));

  const weeks: Date[][] = [];
  let cur = new Date(start);
  while (cur <= lastDay) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur = addDays(cur, 1);
    }
    weeks.push(week);
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
      <div className="bg-slate-50 px-3 py-1.5 font-semibold text-slate-600 border-b border-slate-200">
        {y}年{m + 1}月
      </div>
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {DOW_LABELS.map((d, i) => (
          <div key={d} className={`text-center py-1 ${i >= 5 ? "text-red-400" : "text-slate-400"}`}>{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <WeekRow
          key={wi}
          week={week}
          month={month}
          today={today}
          bars={bars}
          compact={compact}
          showMilestoneLabels={showMilestoneLabels}
          onSelectProject={onSelectProject}
        />
      ))}
    </div>
  );
}

// ─── Week Row ─────────────────────────────────────────────────────────────────

function WeekRow({
  week, month, today, bars, compact, showMilestoneLabels, onSelectProject,
}: {
  week: Date[];
  month: Date;
  today: Date;
  bars: Bar[];
  compact: boolean;
  showMilestoneLabels: boolean;
  onSelectProject: (p: Project) => void;
}) {
  const weekStart = week[0];
  const weekEnd = week[6];
  const m = month.getMonth();

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const activeBars = bars.filter((b) => b.start <= weekEnd && b.end >= weekStart);

  const BAR_H = compact ? 5 : 18;
  const BAR_GAP = 2;

  return (
    <div className="border-b border-slate-200/60 last:border-b-0">
      {/* Day numbers */}
      <div className="grid grid-cols-7">
        {week.map((day, di) => {
          const inMonth = day.getMonth() === m;
          const isToday = day.getTime() === today.getTime();
          const isWeekend = di >= 5;
          const isHoliday = inMonth && HolidayJp.isHoliday(day);

          return (
            <div
              key={di}
              className={`
                text-center border-l border-slate-200/60 first:border-l-0
                flex items-center justify-center
                ${!inMonth ? "text-slate-300 bg-slate-50" : ""}
                ${inMonth && (isHoliday || isWeekend) ? "text-red-400" : ""}
                ${inMonth && !isHoliday && !isWeekend ? "text-slate-500" : ""}
              `}
              style={{ minHeight: compact ? 22 : 26 }}
            >
              {isToday ? (
                <span
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white font-bold"
                  style={{ width: 20, height: 20, fontSize: 11 }}
                >
                  {day.getDate()}
                </span>
              ) : (
                <span style={{ fontSize: compact ? 10 : 11 }}>{day.getDate()}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bars + milestone markers */}
      {activeBars.length > 0 && (
        <div
          className="relative mx-px mb-0.5"
          style={{ height: activeBars.length * (BAR_H + BAR_GAP) + 1 + (showMilestoneLabels ? 14 : 0) }}
        >
          {activeBars.map((bar, i) => {
            const lo = bar.start < weekStart ? weekStart : bar.start;
            const hi = bar.end > weekEnd ? weekEnd : bar.end;
            const clampedStart = lo < monthStart ? monthStart : lo;
            const clampedEnd = hi > monthEnd ? monthEnd : hi;
            if (clampedStart > clampedEnd) return null;
            const startDay = daysBetween(weekStart, clampedStart);
            const spanDays = daysBetween(clampedStart, clampedEnd) + 1;
            const left = (startDay / 7) * 100;
            const width = (spanDays / 7) * 100;
            const isBarStart = bar.start >= clampedStart;
            const isBarEnd = bar.end <= weekEnd;
            const br = `${isBarStart ? 4 : 0}px ${isBarEnd ? 4 : 0}px ${isBarEnd ? 4 : 0}px ${isBarStart ? 4 : 0}px`;
            const top = i * (BAR_H + BAR_GAP);

            // Milestones falling in this week
            const weekMilestones = bar.milestones.filter(
              (ms) => ms.date >= weekStart && ms.date <= weekEnd
                && ms.date >= monthStart && ms.date <= monthEnd
            );

            return (
              <div key={bar.project.id}>
                {/* Project bar */}
                <div
                  onClick={() => onSelectProject(bar.project)}
                  title={bar.label}
                  style={{
                    position: "absolute",
                    top,
                    left: `${left}%`,
                    width: `${width}%`,
                    height: BAR_H,
                    backgroundColor: bar.color,
                    borderRadius: br,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                  className="flex items-center hover:brightness-110 transition-all"
                >
                  {!compact && isBarStart && (
                    <span className="px-1 truncate font-medium" style={{ fontSize: 10, color: "rgba(0,0,0,0.7)" }}>
                      {bar.label}
                    </span>
                  )}
                </div>

                {/* Milestone markers */}
                {weekMilestones.map((ms, mi) => {
                  const msDay = daysBetween(weekStart, ms.date);
                  const msLeft = ((msDay + 0.5) / 7) * 100;
                  const dotSize = compact ? 5 : 8;

                  return (
                    <div key={mi}>
                      {/* Diamond marker */}
                      <div
                        style={{
                          position: "absolute",
                          top: top + BAR_H / 2 - dotSize / 2,
                          left: `${msLeft}%`,
                          width: dotSize,
                          height: dotSize,
                          backgroundColor: "#7c3aed",
                          transform: "translateX(-50%) rotate(45deg)",
                          zIndex: 10,
                          pointerEvents: "none",
                        }}
                        title={ms.type}
                      />
                      {/* Label (1M/3M only) */}
                      {showMilestoneLabels && (
                        <div
                          style={{
                            position: "absolute",
                            top: top + BAR_H + 1,
                            left: `${msLeft}%`,
                            transform: "translateX(-50%)",
                            fontSize: 9,
                            color: "#7c3aed",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            zIndex: 10,
                          }}
                        >
                          {ms.type}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

