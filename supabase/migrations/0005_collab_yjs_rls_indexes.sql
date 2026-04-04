alter table public.document_yjs_state enable row level security;
alter table public.document_yjs_versions enable row level security;

drop policy if exists "document_yjs_state_select_members" on public.document_yjs_state;
create policy "document_yjs_state_select_members" on public.document_yjs_state
for select using (
  exists (
    select 1
    from public.documents d
    where d.id = document_yjs_state.document_id
      and (
        d.owner_id = auth.uid()
        or exists (
          select 1
          from public.collaborators c
          where c.document_id = d.id and c.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "document_yjs_state_insert_writers" on public.document_yjs_state;
create policy "document_yjs_state_insert_writers" on public.document_yjs_state
for insert with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_yjs_state.document_id
      and (
        d.owner_id = auth.uid()
        or exists (
          select 1
          from public.collaborators c
          where c.document_id = d.id
            and c.user_id = auth.uid()
            and c.role in ('owner', 'editor')
        )
      )
  )
);

drop policy if exists "document_yjs_state_update_writers" on public.document_yjs_state;
create policy "document_yjs_state_update_writers" on public.document_yjs_state
for update using (
  exists (
    select 1
    from public.documents d
    where d.id = document_yjs_state.document_id
      and (
        d.owner_id = auth.uid()
        or exists (
          select 1
          from public.collaborators c
          where c.document_id = d.id
            and c.user_id = auth.uid()
            and c.role in ('owner', 'editor')
        )
      )
  )
) with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_yjs_state.document_id
      and (
        d.owner_id = auth.uid()
        or exists (
          select 1
          from public.collaborators c
          where c.document_id = d.id
            and c.user_id = auth.uid()
            and c.role in ('owner', 'editor')
        )
      )
  )
);

drop policy if exists "document_yjs_versions_select_members" on public.document_yjs_versions;
create policy "document_yjs_versions_select_members" on public.document_yjs_versions
for select using (
  exists (
    select 1
    from public.documents d
    where d.id = document_yjs_versions.document_id
      and (
        d.owner_id = auth.uid()
        or exists (
          select 1
          from public.collaborators c
          where c.document_id = d.id and c.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "document_yjs_versions_insert_writers" on public.document_yjs_versions;
create policy "document_yjs_versions_insert_writers" on public.document_yjs_versions
for insert with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_yjs_versions.document_id
      and (
        d.owner_id = auth.uid()
        or exists (
          select 1
          from public.collaborators c
          where c.document_id = d.id
            and c.user_id = auth.uid()
            and c.role in ('owner', 'editor')
        )
      )
  )
);

create index if not exists idx_document_yjs_state_updated_at
  on public.document_yjs_state (updated_at desc);

create index if not exists idx_document_yjs_versions_doc_version
  on public.document_yjs_versions (document_id, version_number desc);