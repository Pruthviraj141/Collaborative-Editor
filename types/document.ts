export type DocumentRole = "owner" | "editor" | "viewer";

export interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  last_edited_by: string | null;
}

export interface DocumentVersionRecord {
  id: string;
  document_id: string;
  version_number: number;
  content_snapshot: string;
  created_by: string;
  created_at: string;
}

export interface CollaboratorRecord {
  id: string;
  document_id: string;
  user_id: string;
  role: DocumentRole;
  created_at: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface ProfileRecord {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentYjsStateRecord {
  document_id: string;
  yjs_state_base64: string;
  html_snapshot: string | null;
  version: number;
  updated_at: string;
  updated_by: string | null;
}

export interface DocumentYjsVersionRecord {
  id: string;
  document_id: string;
  version_number: number;
  yjs_state_base64: string;
  html_snapshot: string | null;
  created_at: string;
  created_by: string | null;
}