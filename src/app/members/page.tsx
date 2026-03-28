import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types";
import MemberSettingsForm from "./MemberSettingsForm";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (profile?.role !== "admin") redirect("/");

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at")
    .returns<Profile[]>();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="text-slate-500 hover:text-slate-200 text-sm transition-colors">← 戻る</a>
          <h1 className="font-semibold text-slate-700 tracking-tight">メンバー設定</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        <MemberSettingsForm members={members ?? []} currentUserId={user.id} />
      </main>
    </div>
  );
}
