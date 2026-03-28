import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { Profile } from "@/types";
import ArtistsManager from "./ArtistsManager";

export default async function ArtistsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (profile?.role !== "admin") redirect("/");

  // 全プロフィール取得
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at")
    .returns<Profile[]>();

  // メールアドレスを admin API で取得
  let emailMap: Record<string, string> = {};
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    emailMap = Object.fromEntries(
      (data?.users ?? []).map((u) => [u.id, u.email ?? ""])
    );
  } catch {
    // SERVICE_ROLE_KEY 未設定時は email 非表示
  }

  const artists = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap[p.id] ?? "",
  }));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <a href="/" className="text-slate-500 hover:text-slate-200 text-sm transition-colors">← 戻る</a>
          <h1 className="font-semibold text-slate-700 tracking-tight">作家管理</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">
        <ArtistsManager artists={artists} />
      </main>
    </div>
  );
}
