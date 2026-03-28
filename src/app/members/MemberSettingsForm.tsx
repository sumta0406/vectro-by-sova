"use client";

import { useState } from "react";
import type { Profile } from "@/types";
import { updateMember } from "@/app/actions/members";

type Props = { members: Profile[]; currentUserId: string };

export default function MemberSettingsForm({ members }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, { name: string; guarantee_rate: string }>>(
    Object.fromEntries(members.map((m) => [m.id, { name: m.name, guarantee_rate: m.guarantee_rate?.toString() ?? "" }]))
  );

  const update = (id: string, field: "name" | "guarantee_rate", value: string) => {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const save = async (id: string) => {
    setSaving(id);
    try {
      await updateMember(id, {
        name: values[id].name,
        guarantee_rate: values[id].guarantee_rate ? Number(values[id].guarantee_rate) : null,
      });
    } finally {
      setSaving(null);
    }
  };

  const INPUT = "bg-white border border-slate-300 text-slate-700 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">各メンバーの名前とデフォルトのギャランティ率を設定します。</p>
      {members.map((m) => (
        <div key={m.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">名前</label>
              <input
                value={values[m.id]?.name ?? ""}
                onChange={(e) => update(m.id, "name", e.target.value)}
                className={`${INPUT} w-full`}
              />
            </div>
            <div className="w-40">
              <label className="text-xs text-slate-500 mb-1 block">ギャランティ率（%）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={values[m.id]?.guarantee_rate ?? ""}
                  onChange={(e) => update(m.id, "guarantee_rate", e.target.value)}
                  placeholder="例：50"
                  min="0"
                  max="100"
                  className={`${INPUT} w-full`}
                />
                <span className="text-slate-500 text-sm">%</span>
              </div>
            </div>
            <div className="pt-5">
              <button
                onClick={() => save(m.id)}
                disabled={saving === m.id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {saving === m.id ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            role: {m.role}
            {m.guarantee_rate != null && (
              <span className="ml-3">現在のギャランティ率: {m.guarantee_rate}%</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
