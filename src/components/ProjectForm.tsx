"use client";

import { useState, useEffect } from "react";
import type { Profile, Project, ProjectType, ProjectStatus, BillingStatus, PaymentStatus, ProjectCost } from "@/types";
import { createProject, updateProject, type ProjectInput } from "@/app/actions/projects";

const PROJECT_TYPES: ProjectType[] = ["法人請け", "個人請け", "社内案件"];
const STATUSES: ProjectStatus[] = ["未着手", "進行中", "完了", "キャンセル", "保留"];
const BILLING_STATUSES: BillingStatus[] = ["未請求", "請求済", "入金"];
const PAYMENT_STATUSES: PaymentStatus[] = ["未払い", "支払済"];

const INPUT = "w-full bg-white border border-slate-300 text-slate-700 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const INPUT_SM = "bg-white border border-slate-300 text-slate-700 placeholder-slate-400 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500";
const LABEL = "text-xs text-slate-500 mb-1 block";
const SECTION = "border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50";

const COLOR_OPTIONS = [
  "#2563eb", "#7c3aed", "#db2777", "#059669",
  "#ea580c", "#ca8a04", "#0891b2", "#dc2626",
  "#16a34a", "#c026d3", "#0284c7", "#4f46e5",
];

type MilestoneInput = { type: string; date: string; memo: string; email_notify: boolean };

type Props = {
  members: Profile[];
  currentUserId: string;
  isAdmin: boolean;
  project?: Project;
  parentId?: string;
  defaultMemberId?: string;
  onClose: () => void;
};

const today = new Date().toISOString().split("T")[0];

export default function ProjectForm({ members, currentUserId, isAdmin, project, parentId, defaultMemberId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [memberId, setMemberId] = useState(project?.member_id ?? defaultMemberId ?? currentUserId);
  const [name, setName] = useState(project?.name ?? "");
  const [client, setClient] = useState(project?.client ?? "");
  const [projectType, setProjectType] = useState<ProjectType | "">(project?.project_type ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "未着手");
  const [billingStatus, setBillingStatus] = useState<BillingStatus>(project?.billing_status ?? "未請求");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(project?.payment_status ?? "未払い");
  const [startDate, setStartDate] = useState(project?.start_date ?? today);
  const [deliveryDate, setDeliveryDate] = useState(project?.delivery_date ?? "");
  const [memo, setMemo] = useState(project?.memo ?? "");
  const [color, setColor] = useState<string | null>(project?.color ?? null);

  // 受注条件
  const [orderAmount, setOrderAmount] = useState(project?.order_amount?.toString() ?? "");
  const [copyrightRegistration, setCopyrightRegistration] = useState(project?.copyright_registration ?? false);
  const [costs, setCosts] = useState<ProjectCost[]>(project?.costs ?? []);
  const [guaranteeAmount, setGuaranteeAmount] = useState(project?.guarantee_amount?.toString() ?? "");
  const [manualGuarantee, setManualGuarantee] = useState(false);

  const [milestones, setMilestones] = useState<MilestoneInput[]>(
    project?.milestones?.map((m) => ({ type: m.type, date: m.date, memo: m.memo ?? "", email_notify: m.email_notify ?? false })) ?? []
  );

  // メンバーのギャランティ率から自動計算
  const selectedMember = members.find((m) => m.id === memberId);
  const totalCost = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  useEffect(() => {
    if (manualGuarantee) return;
    const rate = selectedMember?.guarantee_rate;
    if (!rate || !orderAmount) { setGuaranteeAmount(""); return; }
    const order = Number(orderAmount.replace(/,/g, "")) || 0;
    setGuaranteeAmount(Math.round((order - totalCost) * rate / 100).toString());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, orderAmount, totalCost, manualGuarantee]);

  const addCost = () => setCosts([...costs, { name: "", amount: 0 }]);
  const removeCost = (i: number) => setCosts(costs.filter((_, idx) => idx !== i));
  const updateCost = (i: number, field: keyof ProjectCost, value: string) => {
    setCosts(costs.map((c, idx) => idx === i ? { ...c, [field]: field === "amount" ? Number(value) || 0 : value } : c));
  };

  const addMilestone = () => setMilestones([...milestones, { type: "", date: "", memo: "", email_notify: false }]);
  const removeMilestone = (i: number) => setMilestones(milestones.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, field: keyof MilestoneInput, value: string | boolean) => {
    setMilestones(milestones.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const input: ProjectInput = {
        member_id: memberId,
        name,
        client: client || undefined,
        project_type: projectType || null,
        status,
        billing_status: billingStatus,
        payment_status: paymentStatus,
        start_date: startDate || null,
        delivery_date: deliveryDate || null,
        memo: memo || undefined,
        color: color || null,
        order_amount: orderAmount ? Number(orderAmount.replace(/,/g, "")) : null,
        copyright_registration: copyrightRegistration,
        costs: costs.filter((c) => c.name),
        guarantee_rate: selectedMember?.guarantee_rate ?? null,
        guarantee_amount: guaranteeAmount ? Number(guaranteeAmount) : null,
        milestones: milestones.filter((m) => m.date),
        ...(parentId ? { parent_id: parentId } : {}),
      };
      if (project) {
        await updateProject(project.id, input);
      } else {
        await createProject(input);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-300 tracking-tight">
            {project ? "案件を編集" : parentId ? "サブ案件を追加" : "案件を追加"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className={LABEL}>案件名 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={INPUT} placeholder="例：〇〇 OP楽曲制作" />
            </div>

            <div>
              <label className={LABEL}>カラー</label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(color === c ? null : c)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: color === c ? `2px solid ${c}` : "2px solid transparent",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
                {color && (
                  <button
                    type="button"
                    onClick={() => setColor(null)}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-1"
                  >
                    リセット
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>クライアント</label>
                <input value={client} onChange={(e) => setClient(e.target.value)} className={INPUT} placeholder="例：株式会社〇〇" />
              </div>
              <div>
                <label className={LABEL}>案件種別</label>
                <select value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType | "")} className={INPUT}>
                  <option value="">未選択</option>
                  {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>ステータス</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className={INPUT}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>請求状況</label>
                <select value={billingStatus} onChange={(e) => setBillingStatus(e.target.value as BillingStatus)} className={INPUT}>
                  {BILLING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>作家への支払い</label>
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} className={INPUT}>
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>登録日</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>納品期日</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={INPUT} />
              </div>
            </div>

            {/* 受注条件 */}
            <div className={SECTION}>
              <p className="text-xs font-semibold text-gray-300">受注条件</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>受注金額（税込）</label>
                  <div className="flex">
                    <span className="px-2 py-2 bg-gray-700 border border-gray-600 border-r-0 rounded-l-lg text-gray-400 text-sm">¥</span>
                    <input
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      className={`${INPUT} rounded-l-none flex-1`}
                      placeholder="330000"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="copyright"
                    checked={copyrightRegistration}
                    onChange={(e) => setCopyrightRegistration(e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <label htmlFor="copyright" className="text-sm text-gray-300 cursor-pointer">著作権登録有無</label>
                </div>
              </div>

              {/* コスト */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={LABEL}>コスト</label>
                  <button type="button" onClick={addCost} className="text-xs text-blue-400 hover:text-blue-300">+ 追加</button>
                </div>
                {costs.map((c, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <input
                      value={c.name}
                      onChange={(e) => updateCost(i, "name", e.target.value)}
                      placeholder="名目（例：ギター演奏）"
                      className={`${INPUT_SM} flex-1`}
                    />
                    <div className="flex">
                      <span className="px-1.5 py-1 bg-gray-700 border border-gray-600 border-r-0 rounded-l text-gray-400 text-xs">¥</span>
                      <input
                        type="number"
                        value={c.amount || ""}
                        onChange={(e) => updateCost(i, "amount", e.target.value)}
                        placeholder="0"
                        className={`${INPUT_SM} w-24 rounded-l-none`}
                      />
                    </div>
                    <button type="button" onClick={() => removeCost(i)} className="text-red-500 hover:text-red-400 text-xs">✕</button>
                  </div>
                ))}
                {costs.length > 0 && (
                  <p className="text-xs text-gray-500 text-right">合計コスト: ¥{totalCost.toLocaleString()}</p>
                )}
              </div>

              {/* ギャランティ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={LABEL}>作家へのギャランティ</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="manualGuarantee"
                      checked={manualGuarantee}
                      onChange={(e) => setManualGuarantee(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-500"
                    />
                    <label htmlFor="manualGuarantee" className="text-xs text-gray-400 cursor-pointer">手動入力</label>
                  </div>
                </div>
                <div className="flex">
                  <span className="px-2 py-2 bg-gray-700 border border-gray-600 border-r-0 rounded-l-lg text-gray-400 text-sm">¥</span>
                  <input
                    type="number"
                    value={guaranteeAmount}
                    onChange={(e) => setGuaranteeAmount(e.target.value)}
                    readOnly={!manualGuarantee}
                    placeholder="—"
                    className={`${INPUT} rounded-l-none flex-1 ${!manualGuarantee ? "text-gray-400 cursor-default" : ""}`}
                  />
                </div>
                {!manualGuarantee && (
                  <p className="text-xs text-gray-600 mt-1">
                    {!selectedMember?.guarantee_rate
                      ? "⚠ 作家管理でギャランティ率を設定してください"
                      : !orderAmount
                      ? `受注金額を入力すると自動計算されます（率: ${selectedMember.guarantee_rate}%）`
                      : `(受注 ¥${(Number(orderAmount.replace(/,/g, "")) || 0).toLocaleString()} − コスト ¥${totalCost.toLocaleString()}) × ${selectedMember.guarantee_rate}%`}
                  </p>
                )}
              </div>
            </div>

            {/* マイルストーン */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={LABEL}>マイルストーン</label>
                <button type="button" onClick={addMilestone} className="text-xs text-blue-400 hover:text-blue-300">+ 追加</button>
              </div>
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input value={m.type} onChange={(e) => updateMilestone(i, "type", e.target.value)} placeholder="種別" className={`${INPUT_SM} w-24`} />
                  <input
                    type="date"
                    value={m.date}
                    onChange={(e) => updateMilestone(i, "date", e.target.value)}
                    className={`${INPUT_SM} flex-1`}
                  />
                  <input value={m.memo} onChange={(e) => updateMilestone(i, "memo", e.target.value)} placeholder="メモ" className={`${INPUT_SM} flex-1`} />
                  <label className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.email_notify}
                      onChange={(e) => updateMilestone(i, "email_notify", e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-500"
                    />
                    メール
                  </label>
                  <button type="button" onClick={() => removeMilestone(i)} className="text-red-500 hover:text-red-400 text-xs">✕</button>
                </div>
              ))}
            </div>

            <div>
              <label className={LABEL}>メモ</label>
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} className={`${INPUT} resize-none`} placeholder="備考など" />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-300 text-slate-500 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                キャンセル
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-40 transition-colors">
                {loading ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
