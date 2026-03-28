"use client";

import { useState } from "react";
import type { Profile } from "@/types";
import { inviteArtist, updateArtist, removeArtist } from "@/app/actions/artists";

type ArtistWithEmail = Profile & { email: string };

const INPUT = "bg-white border border-slate-300 text-slate-700 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function ArtistsManager({ artists }: { artists: ArtistWithEmail[] }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const [editing, setEditing] = useState<Record<string, { name: string; guarantee_rate: string }>>(
    Object.fromEntries(
      artists.map((a) => [
        a.id,
        { name: a.name, guarantee_rate: a.guarantee_rate?.toString() ?? "" },
      ])
    )
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<Record<string, string>>({});

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess(false);
    try {
      await inviteArtist(inviteEmail, inviteName);
      setInviteSuccess(true);
      setInviteEmail("");
      setInviteName("");
      setTimeout(() => setShowInviteForm(false), 2000);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setInviting(false);
    }
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    setSaveError((prev) => ({ ...prev, [id]: "" }));
    try {
      const val = editing[id];
      await updateArtist(id, {
        name: val.name,
        guarantee_rate: val.guarantee_rate ? Number(val.guarantee_rate) : null,
      });
    } catch (err) {
      setSaveError((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "エラーが発生しました",
      }));
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (artist: ArtistWithEmail) => {
    if (!confirm(`「${artist.name}」を削除しますか？\nこの操作は取り消せません。案件データも削除されます。`)) return;
    try {
      await removeArtist(artist.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        {!showInviteForm ? (
          <button
            onClick={() => setShowInviteForm(true)}
            className="w-full py-2 border border-dashed border-slate-300 text-slate-400 hover:text-blue-500 hover:border-blue-400 rounded-lg text-sm transition-colors"
          >
            + 新規作家を招待
          </button>
        ) : (
          <form onSubmit={handleInvite} className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">新規作家を招待</p>
            <p className="text-xs text-slate-500">
              入力したメールアドレスに招待リンクを送信します。作家がリンクをクリックするとアカウントが有効化されます。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">名前</label>
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                  placeholder="例：田中 太郎"
                  className={`${INPUT} w-full`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">メールアドレス</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="artist@example.com"
                  className={`${INPUT} w-full`}
                />
              </div>
            </div>
            {inviteError && <p className="text-red-500 text-xs">{inviteError}</p>}
            {inviteSuccess && <p className="text-emerald-600 text-xs">招待メールを送信しました！</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowInviteForm(false); setInviteError(""); }}
                className="px-4 py-2 border border-slate-300 text-slate-500 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {inviting ? "送信中..." : "招待メールを送る"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Artist list */}
      {artists.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">まだ作家が登録されていません</p>
      ) : (
        artists.map((artist) => {
          const val = editing[artist.id] ?? { name: artist.name, guarantee_rate: "" };
          return (
            <div key={artist.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0 border border-slate-200">
                  {(val.name || artist.name).charAt(0)}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">名前</label>
                      <input
                        value={val.name}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [artist.id]: { ...prev[artist.id], name: e.target.value },
                          }))
                        }
                        className={`${INPUT} w-full`}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">ギャランティ率</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={val.guarantee_rate}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [artist.id]: { ...prev[artist.id], guarantee_rate: e.target.value },
                            }))
                          }
                          placeholder="例：50"
                          className={`${INPUT} w-full`}
                        />
                        <span className="text-slate-500 text-sm shrink-0">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{artist.email}</span>
                      <span className={`px-2 py-0.5 rounded-full ${
                        artist.role === "admin"
                          ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                          : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                      }`}>
                        {artist.role === "admin" ? "管理者" : "作家"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {saveError[artist.id] && (
                        <span className="text-red-500 text-xs">{saveError[artist.id]}</span>
                      )}
                      {artist.role !== "admin" && (
                        <button
                          onClick={() => handleRemove(artist)}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                        >
                          削除
                        </button>
                      )}
                      <button
                        onClick={() => handleSave(artist.id)}
                        disabled={saving === artist.id}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-500 disabled:opacity-50 transition-colors"
                      >
                        {saving === artist.id ? "保存中..." : "保存"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
