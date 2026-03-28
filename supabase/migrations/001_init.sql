-- =====================================================
-- profiles: auth.usersを拡張
-- =====================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- 全員がprofilesを読める（名前表示のため）
create policy "profiles: anyone can read"
  on public.profiles for select
  using (true);

-- 自分自身のみ更新可
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- auth.usersにユーザー作成時に自動でprofileを作る
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- projects: 案件（親子2階層）
-- =====================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.projects(id) on delete cascade, -- nullなら親案件
  member_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  client text,
  amount integer,
  status text not null default '未着手' check (status in ('未着手', '進行中', '完了', 'キャンセル')),
  start_date date,
  delivery_date date,
  memo text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

-- 管理者は全件読める。作家は自分のものだけ
create policy "projects: read"
  on public.projects for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or member_id = auth.uid()
  );

-- 管理者は全件作成可。作家は自分のものだけ
create policy "projects: insert"
  on public.projects for insert
  with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or member_id = auth.uid()
  );

-- 管理者は全件更新可。作家は自分のものだけ
create policy "projects: update"
  on public.projects for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or member_id = auth.uid()
  );

-- 管理者は全件削除可。作家は自分のものだけ
create policy "projects: delete"
  on public.projects for delete
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
    or member_id = auth.uid()
  );

-- updated_atを自動更新
create or replace function public.update_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.update_updated_at();

-- =====================================================
-- milestones: 案件内の日付イベント
-- =====================================================
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  type text not null check (type in ('打ち合わせ', '初稿提出', '歌詞提出', 'データ作成', '納品', 'その他')),
  date date not null,
  memo text,
  created_at timestamptz default now()
);

alter table public.milestones enable row level security;

-- projectsへのアクセス権があればmilestonesも読み書き可
create policy "milestones: read"
  on public.milestones for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          (select role from public.profiles where id = auth.uid()) = 'admin'
          or p.member_id = auth.uid()
        )
    )
  );

create policy "milestones: insert"
  on public.milestones for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          (select role from public.profiles where id = auth.uid()) = 'admin'
          or p.member_id = auth.uid()
        )
    )
  );

create policy "milestones: update"
  on public.milestones for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          (select role from public.profiles where id = auth.uid()) = 'admin'
          or p.member_id = auth.uid()
        )
    )
  );

create policy "milestones: delete"
  on public.milestones for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          (select role from public.profiles where id = auth.uid()) = 'admin'
          or p.member_id = auth.uid()
        )
    )
  );

-- =====================================================
-- project_history: 編集履歴
-- =====================================================
create table public.project_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  changed_by uuid references public.profiles(id),
  changes jsonb,
  created_at timestamptz default now()
);

alter table public.project_history enable row level security;

-- projectsへのアクセス権があれば履歴も読める
create policy "history: read"
  on public.project_history for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (
          (select role from public.profiles where id = auth.uid()) = 'admin'
          or p.member_id = auth.uid()
        )
    )
  );

-- サーバーサイドのみ書き込み可（service_role使用）
create policy "history: insert service only"
  on public.project_history for insert
  with check (true);
