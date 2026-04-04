create table if not exists public.document_yjs_state (
  document_id uuid primary key references public.documents(id) on delete cascade,
  yjs_state_base64 text not null default '',
  html_snapshot text,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.document_yjs_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number bigint not null,
  yjs_state_base64 text not null,
  html_snapshot text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (document_id, version_number)
);

alter table public.document_yjs_state enable row level security;
alter table public.document_yjs_versions enable row level security;
