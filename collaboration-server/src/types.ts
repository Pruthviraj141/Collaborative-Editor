export type CollaborationRole = "viewer" | "editor" | "owner";

export interface CollabTokenPayload {
  documentId: string;
  role: CollaborationRole;
  userId: string;
  name?: string | null;
  workspaceId?: string | null;
}

export interface PersistedYjsState {
  documentId: string;
  yjsStateBase64: string;
  htmlSnapshot: string | null;
  version: number;
}
