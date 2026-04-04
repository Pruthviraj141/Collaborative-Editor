create index if not exists idx_documents_workspace_updated
  on public.documents (workspace_id, updated_at desc)
  where is_archived = false;

create index if not exists idx_documents_owner
  on public.documents (owner_id);

create index if not exists idx_document_versions_document
  on public.document_versions (document_id, version_number desc);

create index if not exists idx_collaborators_user
  on public.collaborators (user_id);