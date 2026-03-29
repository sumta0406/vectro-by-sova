"use client";

import { useState } from "react";
import type { Project } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  "未着手": "未着手", "進行中": "進行中",
  "完了": "完了", "キャンセル": "キャンセル", "保留": "保留",
};

type Props = {
  project: Project;
  memberName: string;
  color: string;
  onEdit: () => void;
  onClose: () => void;
};

export default function ProjectDetail({ project, memberName, color, onEdit, onClose }: Props) {
  const milestones = (project.milestones ?? [])
    .filter((m) => m.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "min(720px, 95vw)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-700 truncate">{project.name}</div>
            {memberName && <div className="text-xs text-slate-400">{memberName}</div>}
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg transition-colors border border-slate-200"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            編集
          </button>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100 ml-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row text-sm max-h-[75vh] overflow-y-auto">
          {/* Fields */}
          <div className="flex-1 px-5 py-4 space-y-3 min-w-0">
            <div className="grid grid-cols-2 gap-3">
              {project.client && <Row label="クライアント" value={project.client} />}
              {project.project_type && <Row label="案件種別" value={project.project_type} />}
            </div>
            <Row label="ステータス" value={STATUS_LABELS[project.status] ?? project.status} />
            <Row label="請求" value={`${project.billing_status} / 支払: ${project.payment_status}`} />

            <div className="grid grid-cols-2 gap-3">
              <Row label="着手日" value={project.start_date ?? "—"} />
              <Row label="納品期日" value={project.delivery_date ?? "—"} />
            </div>

            {project.order_amount != null && (
              <div className="grid grid-cols-2 gap-3">
                <Row label="受注金額" value={`¥${project.order_amount.toLocaleString()}`} />
                <Row label="著作権登録" value={project.copyright_registration ? "あり" : "なし"} />
              </div>
            )}
            {project.guarantee_amount != null && (
              <Row label="ギャランティ" value={`¥${project.guarantee_amount.toLocaleString()}`} />
            )}
            {project.costs && project.costs.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">コスト</div>
                {project.costs.map((c, i) => (
                  <div key={i} className="flex justify-between text-slate-600 text-xs">
                    <span>{c.name}</span>
                    <span>¥{c.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {milestones.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">マイルストーン</div>
                <div className="space-y-1">
                  {milestones.map((ms) => (
                    <div key={ms.id} className="flex items-center gap-2 text-slate-600 text-xs">
                      <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                      <span className="text-slate-400">{ms.date}</span>
                      <span>{ms.type}</span>
                      {ms.memo && <span className="text-slate-400">— {ms.memo}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Memo */}
          <MemoPanel memo={project.memo} />
        </div>
      </div>
    </div>
  );
}

function MemoPanel({ memo }: { memo: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 150;
  const display = !memo ? null : expanded ? memo : memo.slice(0, LIMIT);
  const truncated = memo && memo.length > LIMIT;

  return (
    <div className="sm:w-64 sm:shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 px-5 py-4 bg-slate-50">
      <div className="text-xs text-slate-400 mb-2">メモ</div>
      <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap min-h-[200px]">
        {display ? (
          <>
            {display}{!expanded && truncated && "…"}
            {truncated && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="block mt-2 text-xs text-blue-500 hover:text-blue-400 transition-colors"
              >
                {expanded ? "折りたたむ" : "さらに表示"}
              </button>
            )}
          </>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-slate-900 font-medium mt-0.5">{value}</div>
    </div>
  );
}
