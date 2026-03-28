-- 管理者が全プロフィールを更新できるポリシー
create policy "profiles: admin can update all"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
