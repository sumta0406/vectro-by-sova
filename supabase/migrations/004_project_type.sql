alter table public.projects
  add column if not exists project_type text
  check (project_type in ('法人請け', '個人請け', '社内案件'));
