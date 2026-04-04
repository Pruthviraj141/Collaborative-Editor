alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.collaborators enable row level security;

drop policy if exists "workspaces_read_member" on public.workspaces;
create policy "workspaces_read_member" on public.workspaces
for select using (
  owner_id = auth.uid() or exists (
    select 1
    from public.collaborators c
    join public.documents d on d.id = c.document_id
    where c.user_id = auth.uid() and d.workspace_id = workspaces.id
  )
);

drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner" on public.workspaces
for insert with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner" on public.workspaces
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
for select using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "documents_select_all" on public.documents;
create policy "documents_select_all" on public.documents
for select using (true);

drop policy if exists "documents_insert_owner" on public.documents;
create policy "documents_insert_owner" on public.documents
for insert with check (owner_id = auth.uid());

drop policy if exists "documents_update_owner_or_editor" on public.documents;
create policy "documents_update_owner_or_editor" on public.documents
for update using (
  owner_id = auth.uid() or exists (
    select 1 from public.collaborators c
    where c.document_id = documents.id
      and c.user_id = auth.uid()
      and c.role in ('owner', 'editor')
  )
) with check (
  owner_id = auth.uid() or exists (
    select 1 from public.collaborators c
    where c.document_id = documents.id
      and c.user_id = auth.uid()
      and c.role in ('owner', 'editor')
  )
);

drop policy if exists "documents_delete_owner" on public.documents;
create policy "documents_delete_owner" on public.documents
for delete using (owner_id = auth.uid());

drop policy if exists "document_versions_select_members" on public.document_versions;
create policy "document_versions_select_members" on public.document_versions
for select using (
  exists (
    select 1 from public.documents d
    where d.id = document_versions.document_id
      and (
        d.owner_id = auth.uid() or exists (
          select 1 from public.collaborators c
          where c.document_id = d.id and c.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "document_versions_insert_writer" on public.document_versions;
create policy "document_versions_insert_writer" on public.document_versions
for insert with check (
  exists (
    select 1 from public.documents d
    where d.id = document_versions.document_id
      and (
        d.owner_id = auth.uid() or exists (
          select 1 from public.collaborators c
          where c.document_id = d.id
            and c.user_id = auth.uid()
            and c.role in ('owner', 'editor')
        )
      )
  ) and created_by = auth.uid()
);

drop policy if exists "collaborators_select_members" on public.collaborators;
create policy "collaborators_select_members" on public.collaborators
for select using (
  exists (
    select 1 from public.documents d
    where d.id = collaborators.document_id
      and (
        d.owner_id = auth.uid() or collaborators.user_id = auth.uid()
      )
  )
);

drop policy if exists "collaborators_insert_owner" on public.collaborators;
create policy "collaborators_insert_owner" on public.collaborators
for insert with check (
  exists (
    select 1 from public.documents d
    where d.id = collaborators.document_id and d.owner_id = auth.uid()
  )
);

drop policy if exists "collaborators_delete_owner" on public.collaborators;
create policy "collaborators_delete_owner" on public.collaborators
for delete using (
  exists (
    select 1 from public.documents d
    where d.id = collaborators.document_id and d.owner_id = auth.uid()
  )
);