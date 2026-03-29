alter table public.milestones add column if not exists email_notify boolean not null default false;
