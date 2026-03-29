"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProjectType, ProjectStatus, BillingStatus, PaymentStatus, ProjectCost } from "@/types";

export type ProjectInput = {
  parent_id?: string | null;
  member_id: string;
  name: string;
  client?: string;
  project_type?: ProjectType | null;
  status?: ProjectStatus;
  billing_status?: BillingStatus;
  payment_status?: PaymentStatus;
  start_date?: string | null;
  delivery_date?: string | null;
  memo?: string;
  color?: string | null;
  order_amount?: number | null;
  copyright_registration?: boolean;
  costs?: ProjectCost[];
  guarantee_rate?: number | null;
  guarantee_amount?: number | null;
  milestones?: { type: string; date: string; memo?: string; email_notify?: boolean }[];
};

async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("未ログイン");
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function createProject(input: ProjectInput) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { milestones, ...projectData } = input;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ ...projectData, created_by: profile.id, updated_by: profile.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (milestones && milestones.length > 0) {
    await supabase.from("milestones").insert(
      milestones.map((m) => ({ ...m, project_id: project.id }))
    );
  }

  await supabase.from("project_history").insert({
    project_id: project.id,
    action: "created",
    changed_by: profile.id,
    changes: null,
  });

  revalidatePath("/");
  return project;
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { milestones, ...projectData } = input;

  const { data: before } = await supabase.from("projects").select("*").eq("id", id).single();

  const { data: project, error } = await supabase
    .from("projects")
    .update({ ...projectData, updated_by: profile.id })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (milestones !== undefined) {
    await supabase.from("milestones").delete().eq("project_id", id);
    if (milestones.length > 0) {
      await supabase.from("milestones").insert(
        milestones.map((m) => ({ ...m, project_id: id }))
      );
    }
  }

  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of Object.keys(projectData) as (keyof typeof projectData)[]) {
    if (before && JSON.stringify(before[key as keyof typeof before]) !== JSON.stringify(projectData[key])) {
      changes[key] = { before: before[key as keyof typeof before], after: projectData[key] };
    }
  }

  await supabase.from("project_history").insert({
    project_id: id,
    action: "updated",
    changed_by: profile.id,
    changes,
  });

  revalidatePath("/");
  return project;
}

export async function archiveEligibleProjects() {
  const supabase = await createClient();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const cutoff = oneYearAgo.toISOString().split("T")[0];

  await supabase
    .from("projects")
    .update({ is_archived: true })
    .eq("status", "完了")
    .eq("is_archived", false)
    .lt("delivery_date", cutoff);
}

export async function sendMilestoneReminders() {
  const supabase = await createClient();
  const today = new Date();
  const target = new Date(today);
  target.setDate(today.getDate() + 3);
  const targetStr = target.toISOString().split("T")[0];

  // email_notify=true かつ3日後のマイルストーンを取得
  const { data: milestones } = await supabase
    .from("milestones")
    .select("*, projects!inner(name, member_id, is_archived, profiles!projects_member_id_fkey(name))")
    .eq("date", targetStr)
    .eq("email_notify", true)
    .eq("projects.is_archived", false);

  if (!milestones || milestones.length === 0) return;

  // 各マイルストーンのメンバーのメールアドレスを取得してメール送信
  for (const ms of milestones) {
    const memberId = ms.projects?.member_id;
    if (!memberId) continue;

    // Supabase Auth からメールアドレスを取得（admin client が必要）
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: { user } } = await admin.auth.admin.getUserById(memberId);
    if (!user?.email) continue;

    const projectName = ms.projects?.name ?? "案件";
    const memberName = ms.projects?.profiles?.name ?? "";
    const subject = `【Vectro】リマインド: ${projectName} - ${ms.type} まで3日`;
    const body = `${memberName} さん\n\n以下のマイルストーンが3日後に迫っています。\n\n案件: ${projectName}\nマイルストーン: ${ms.type}\n日付: ${ms.date}\n${ms.memo ? `メモ: ${ms.memo}` : ""}\n\n---\nVectro by SOVA`;

    // nodemailer でSMTP送信
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: `"Vectro by SOVA" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject,
      text: body,
    }).catch(() => {/* SMTP未設定でも無視 */});
  }
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  await supabase.from("project_history").insert({
    project_id: id,
    action: "deleted",
    changed_by: profile.id,
    changes: null,
  });

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}
