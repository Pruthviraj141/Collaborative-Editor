export type EditorSyncStatus =
  | "saved"
  | "syncing"
  | "read-only"
  | "error"
  | "connected"
  | "reconnecting"
  | "offline";

export interface CollaboratorPresence {
  id: string;
  name: string;
  color: string;
}

export interface EditorSessionState {
  documentId: string;
  title: string;
  content: string;
  isDirty: boolean;
  status: EditorSyncStatus;
}