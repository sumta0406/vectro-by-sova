"use client";

import { useState, useMemo } from "react";
import type { Profile, Project } from "@/types";
import GanttChart from "./GanttChart";
import ProjectList from "./ProjectList";
import MilestoneNotifications from "./MilestoneNotifications";

type NotificationItem = {
  memberId: string;
  projectName: string;
  milestoneType: string;
  date: string;
  daysLeft: number;
};

type ArchivedProject = Pick<Project, "id" | "name" | "member_id" | "delivery_date" | "status" | "color">;

type Props = {
  members: Profile[];
  projects: Project[];
  archivedProjects: ArchivedProject[];
  currentUserId: string;
  isAdmin: boolean;
  notifications: NotificationItem[];
};

export default function ProjectView({ members, projects, archivedProjects, currentUserId, isAdmin, notifications }: Props) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    isAdmin ? (members[0]?.id ?? currentUserId) : currentUserId
  );
  const [showArchive, setShowArchive] = useState(false);

  const filteredMembers = useMemo(
    () => members.filter((m) => m.id === selectedMemberId),
    [members, selectedMemberId]
  );

  const filteredProjects = useMemo(
    () => projects.filter((p) => p.member_id === selectedMemberId),
    [projects, selectedMemberId]
  );

  const filteredArchived = useMemo(
    () => archivedProjects.filter((p) => p.member_id === selectedMemberId),
    [archivedProjects, selectedMemberId]
  );

  const memberNameMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members]
  );

  return (
    <>
      {isAdmin && (
        <div className="flex gap-2 flex-wrap">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedMemberId === m.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      <MilestoneNotifications
        notifications={notifications.filter((n) => n.memberId === selectedMemberId)}
      />

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 lg:flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900 mb-4">スケジュール</h2>
          <GanttChart
            members={filteredMembers}
            projects={filteredProjects}
            currentUserId={selectedMemberId}
            isAdmin={isAdmin}
          />
        </section>

        <section className="lg:flex-1 min-w-0">
          <ProjectList
            members={filteredMembers}
            projects={filteredProjects}
            currentUserId={selectedMemberId}
            isAdmin={isAdmin}
          />
        </section>
      </div>

      {/* アーカイブ */}
      <section>
        <button
          onClick={() => setShowArchive((v) => !v)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="10" width="18" height="11" rx="1"/>
            <path d="M3 6h18v4H3z"/>
            <path d="M10 15h4"/>
          </svg>
          <span>過去の案件（アーカイブ）</span>
          {filteredArchived.length > 0 && (
            <span className="text-xs bg-slate-900/10 text-slate-600 px-2 py-0.5 rounded-full">
              {filteredArchived.length}
            </span>
          )}
        </button>

        {showArchive && (
          <div className="mt-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredArchived.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-400">アーカイブされた案件はありません</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredArchived.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color ?? "#94a3b8" }}
                    />
                    <span className="flex-1 text-slate-500">{p.name}</span>
                    {!isAdmin && (
                      <span className="text-xs text-slate-400">{memberNameMap[p.member_id]}</span>
                    )}
                    <span className="text-xs text-slate-400">{p.delivery_date ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
