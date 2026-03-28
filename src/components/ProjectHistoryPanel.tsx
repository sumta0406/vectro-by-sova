"use client";

import { useEffect, useState } from "react";
import type { Profile, Project, ProjectHistory } from "@/types";
import { createClient } from "@/lib/supabase/client";

const ACTION_LABEL: Record<string, string> = {
  created: "作成",
  updated: "更新",
  deleted: "削除",
};

type Props = {
  project: Project;
  members: Profile[];
  onClose: () => void;
};

export default function ProjectHistoryPanel({ project, members, onClose }: Props) {
  const [history, setHistory] = useState<ProjectHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("project_history")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setHistory((data as ProjectHistory[]) ?? []);
        setLoading(false);
      });
  }, [project.id]);

  const getMemberName = (id: string | null) => {
    if (!id) return "不明";
    return members.find((m) => m.id === id)?.name ?? "不明";
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-100">編集履歴</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
          </div>
          <p className="text-sm text-gray-400 mb-4">{project.name}</p>

          {loading ? (
            <p className="text-sm text-gray-500">読み込み中...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500">履歴なし</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="border-l-2 border-gray-600 pl-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-medium ${h.action === "deleted" ? "text-red-400" : h.action === "created" ? "text-green-400" : "text-blue-400"}`}>
                      {ACTION_LABEL[h.action]}
                    </span>
                    <span className="text-gray-400">{getMemberName(h.changed_by)}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(h.created_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {h.changes && Object.keys(h.changes).length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {Object.entries(h.changes).map(([key, { before, after }]) => (
                        <div key={key} className="text-xs text-gray-500">
                          <span className="font-medium text-gray-400">{key}</span>:{" "}
                          <span className="line-through text-gray-600">{String(before ?? "なし")}</span>
                          {" → "}
                          <span className="text-gray-300">{String(after ?? "なし")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
