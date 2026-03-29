"use client";

import { useState, useCallback, useMemo } from "react";
import type { Profile, Project, ProjectHistory } from "@/types";
import { deleteProject, updateProject } from "@/app/actions/projects";
import type { ProjectStatus, BillingStatus, PaymentStatus } from "@/types";
import ProjectForm from "./ProjectForm";

const STATUSES: ProjectStatus[] = ["未着手", "進行中", "完了", "キャンセル", "保留"];
const CYCLE_STATUSES: ProjectStatus[] = ["未着手", "進行中", "完了"];
const BILLING_STATUSES: BillingStatus[] = ["未請求", "請求済", "入金"];
const PAYMENT_STATUSES: PaymentStatus[] = ["未払い", "支払済"];

const S = { strokeWidth: "1.75", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none", stroke: "currentColor" };

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" {...S}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" {...S}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" {...S}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const AddChildIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" {...S}>
    <polyline points="4 3 4 14 14 14"/>
    <line x1="14" y1="10" x2="14" y2="18"/>
    <line x1="10" y1="14" x2="18" y2="14"/>
  </svg>
);

const PlusCircleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" {...S}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
import ProjectHistoryPanel from "./ProjectHistoryPanel";
import ProjectDetail from "./ProjectDetail";

const STATUS_BADGE: Record<string, string> = {
  "未着手": "bg-slate-200 text-slate-600 font-medium",
  "進行中": "bg-blue-500 text-white font-semibold",
  "完了": "bg-emerald-500 text-white font-semibold",
  "キャンセル": "bg-red-400 text-white font-medium",
  "保留": "bg-amber-400 text-white font-medium",
};

const BILLING_BADGE: Record<string, string> = {
  "未請求": "bg-slate-200 text-slate-600 font-medium",
  "請求済": "bg-orange-400 text-white font-semibold",
  "入金": "bg-emerald-500 text-white font-semibold",
};

const PAYMENT_BADGE: Record<string, string> = {
  "未払い": "bg-slate-200 text-slate-600 font-medium",
  "支払済": "bg-violet-500 text-white font-semibold",
};

const TYPE_BADGE: Record<string, string> = {
  "法人請け": "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200",
  "個人請け": "bg-teal-50 text-teal-600 ring-1 ring-teal-200",
  "社内案件": "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  "自作品": "bg-rose-50 text-rose-500 ring-1 ring-rose-200",
};

type Props = {
  members: Profile[];
  projects: Project[];
  currentUserId: string;
  isAdmin: boolean;
};

export default function ProjectList({ members, projects, currentUserId, isAdmin }: Props) {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null | undefined>(undefined);
  const [addingMemberId, setAddingMemberId] = useState<string | undefined>(undefined);
  const [historyProject, setHistoryProject] = useState<Project | null>(null);
  const visibleMembers = isAdmin ? members : members.filter((m) => m.id === currentUserId);
  const rootProjects = (memberId: string) =>
    projects.filter((p) => p.member_id === memberId && !p.parent_id);

  const handleDelete = async (project: Project) => {
    if (!confirm(`「${project.name}」を削除しますか？`)) return;
    await deleteProject(project.id);
  };

  return (
    <div className="space-y-6">
      {visibleMembers.map((member) => (
        <div key={member.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <span className="text-base font-bold text-slate-900">案件一覧</span>
            <button
              onClick={() => { setAddingParentId(null); setAddingMemberId(member.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white text-xs font-semibold rounded-full shadow-sm transition-all"
            >
              <PlusCircleIcon />
              <span>案件追加</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {rootProjects(member.id).length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-400">案件なし</p>
            ) : (
              rootProjects(member.id).map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isAdmin={isAdmin}
                  onDetail={() => setDetailProject(project)}
                  onEdit={() => setEditingProject(project)}
                  onDelete={() => handleDelete(project)}
                  onHistory={() => setHistoryProject(project)}
                  indent={0}
                />
              ))
            )}
          </div>
        </div>
      ))}

      {addingParentId !== undefined && (
        <ProjectForm
          members={visibleMembers}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          parentId={addingParentId ?? undefined}
          defaultMemberId={addingMemberId}
          onClose={() => { setAddingParentId(undefined); setAddingMemberId(undefined); }}
        />
      )}

      {editingProject && (
        <ProjectForm
          members={visibleMembers}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          project={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}

      {historyProject && (
        <ProjectHistoryPanel
          project={historyProject}
          members={members}
          onClose={() => setHistoryProject(null)}
        />
      )}

      {detailProject && (
        <ProjectDetail
          project={detailProject}
          memberName={members.find((m) => m.id === detailProject.member_id)?.name ?? ""}
          color={detailProject.color ?? "#94a3b8"}
          onEdit={() => { setEditingProject(detailProject); setDetailProject(null); }}
          onClose={() => setDetailProject(null)}
        />
      )}
    </div>
  );
}

type RowProps = {
  project: Project;
  isAdmin: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHistory: () => void;
  indent: number;
};

function ProjectRow({ project, isAdmin, onDetail, onEdit, onDelete, onHistory, indent }: RowProps) {
  const [status, setStatus] = useState(project.status);
  const [billing, setBilling] = useState(project.billing_status);
  const [payment, setPayment] = useState(project.payment_status);

  const cycleStatus = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = CYCLE_STATUSES.indexOf(status);
    if (idx === -1) return; // キャンセル・保留は編集画面からのみ
    const next = CYCLE_STATUSES[(idx + 1) % CYCLE_STATUSES.length];
    setStatus(next);
    await updateProject(project.id, { status: next });
  }, [status, project.id]);

  const cycleBilling = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = BILLING_STATUSES[(BILLING_STATUSES.indexOf(billing) + 1) % BILLING_STATUSES.length];
    setBilling(next);
    await updateProject(project.id, { billing_status: next });
  }, [billing, project.id]);

  const cyclePayment = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = PAYMENT_STATUSES[(PAYMENT_STATUSES.indexOf(payment) + 1) % PAYMENT_STATUSES.length];
    const msg = next === "支払済"
      ? `「${project.name}」を支払済にしますか？`
      : `「${project.name}」を未払いに戻しますか？`;
    if (!confirm(msg)) return;
    setPayment(next);
    await updateProject(project.id, { payment_status: next });
  }, [payment, project.id, project.name]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 text-sm cursor-pointer transition-colors ${indent > 0 ? "pl-8 bg-slate-50/70" : ""}`}
      onClick={onDetail}
    >

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {project.color && (
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
          )}
          <span className="font-semibold text-slate-900">{project.name}</span>
          {project.project_type && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGE[project.project_type] ?? "bg-slate-700/50 text-slate-500"}`}>{project.project_type}</span>
          )}
          {CYCLE_STATUSES.includes(status) ? (
            <button
              onClick={cycleStatus}
              className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:brightness-125 transition-all ${STATUS_BADGE[status]}`}
            >{status}</button>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[status]}`}>{status}</span>
          )}
          {project.project_type !== "自作品" && (
            isAdmin ? (
              <>
                <button
                  onClick={cycleBilling}
                  className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:brightness-125 transition-all ${BILLING_BADGE[billing]}`}
                >{billing}</button>
                <button
                  onClick={cyclePayment}
                  className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:brightness-125 transition-all ${PAYMENT_BADGE[payment]}`}
                >{payment}</button>
              </>
            ) : (
              <>
                <span className={`text-xs px-2 py-0.5 rounded-full ${BILLING_BADGE[billing]}`}>{billing}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${PAYMENT_BADGE[payment]}`}>{payment}</span>
              </>
            )
          )}
          {project.client && <span className="text-xs text-slate-600">{project.client}</span>}
          {project.order_amount && (
            <span className="text-xs font-medium text-slate-700">¥{project.order_amount.toLocaleString()}</span>
          )}
        </div>
        {(project.start_date || project.delivery_date) && (
          <div className="text-xs text-slate-500 mt-0.5">
            {project.start_date ?? "?"} → {project.delivery_date ?? "?"}
          </div>
        )}
        {project.memo && (
          <div className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            {project.memo.length > 50 ? project.memo.slice(0, 50) + "…" : project.memo}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={onHistory} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100" title="履歴">
          <ClockIcon />
        </button>
        <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors rounded hover:bg-slate-100" title="編集">
          <PencilIcon />
        </button>
        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="削除">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
