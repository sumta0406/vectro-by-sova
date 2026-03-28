"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMember(id: string, data: { name?: string; guarantee_rate?: number | null }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("未ログイン");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("権限がありません");

  const { error } = await supabase.from("profiles").update(data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/members");
  revalidatePath("/");
}
