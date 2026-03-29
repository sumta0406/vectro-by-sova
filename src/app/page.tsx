import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile, Project } from "@/types";
import ProjectView from "@/components/ProjectView";
import { archiveEligibleProjects, sendMilestoneReminders } from "@/app/actions/projects";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";

  // アーカイブ対象を自動処理
  await archiveEligibleProjects().catch(() => {});
  // メールリマインダー送信（3日前のマイルストーン）
  await sendMilestoneReminders().catch(() => {});

  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at")
    .returns<Profile[]>();

  const { data: projects } = await supabase
    .from("projects")
    .select(`*, milestones (*)`)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .returns<Project[]>();

  // 3日以内のマイルストーン通知
  const today = new Date();
  const in3days = new Date(today);
  in3days.setDate(today.getDate() + 3);
  const todayStr = today.toISOString().split("T")[0];
  const in3daysStr = in3days.toISOString().split("T")[0];

  const { data: upcomingMilestones } = await supabase
    .from("milestones")
    .select("*, projects!inner(name, member_id, is_archived)")
    .gte("date", todayStr)
    .lte("date", in3daysStr)
    .eq("projects.is_archived", false)
    .order("date");

  const todayMs = new Date(todayStr).getTime();
  const notifications = (upcomingMilestones ?? [])
    .filter((m: { projects: { member_id: string } }) =>
      isAdmin || m.projects.member_id === user.id
    )
    .map((m: { type: string; date: string; projects: { name: string; member_id: string } }) => {
      const daysLeft = Math.round((new Date(m.date).getTime() - todayMs) / 86400000);
      return { memberId: m.projects.member_id, projectName: m.projects.name, milestoneType: m.type, date: m.date, daysLeft };
    });

  const { data: archivedProjects } = await supabase
    .from("projects")
    .select("id, name, member_id, delivery_date, status, color")
    .eq("is_archived", true)
    .order("delivery_date", { ascending: false })
    .returns<Pick<Project, "id" | "name" | "member_id" | "delivery_date" | "status" | "color">[]>();

  const projectMap = new Map<string, Project>();
  for (const p of projects ?? []) {
    projectMap.set(p.id, { ...p, children: [] });
  }
  for (const p of projectMap.values()) {
    if (p.parent_id) {
      projectMap.get(p.parent_id)?.children?.push(p);
    }
  }
  const allProjects = Array.from(projectMap.values());

  return (
    <div className="min-h-screen">
      <header className="bg-white/40 backdrop-blur-xl border-b border-white/50 sticky top-0 z-10">
        <div className="w-full px-6 py-3 flex items-center justify-between">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Vectro by SOVA</h1>
          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-slate-700">{profile.name}</span>
            {isAdmin && (
              <a href="/artists" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">作家管理</a>
            )}
            <form action={signOut}>
              <button type="submit" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-6 space-y-6">
        <ProjectView
          members={members ?? []}
          projects={allProjects}
          archivedProjects={archivedProjects ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
          notifications={notifications}
        />
      </main>
    </div>
  );
}
