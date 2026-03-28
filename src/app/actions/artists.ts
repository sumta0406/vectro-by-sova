"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("未ログイン");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("権限がありません");
}

export async function inviteArtist(email: string, name: string) {
  await assertAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name: name || email.split("@")[0] },
  });
  if (error) throw new Error(error.message);

  // プロフィールがトリガーで作成されるが、名前を上書きする
  if (data.user && name) {
    await admin
      .from("profiles")
      .update({ name })
      .eq("id", data.user.id);
  }

  revalidatePath("/artists");
  revalidatePath("/");
}

export async function updateArtist(
  id: string,
  data: { name?: string; guarantee_rate?: number | null }
) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/artists");
  revalidatePath("/");
}

export async function removeArtist(id: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidatePath("/artists");
  revalidatePath("/");
}
