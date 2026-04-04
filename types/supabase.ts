import type {
  CollaboratorRecord,
  DocumentRecord,
  DocumentVersionRecord,
  DocumentYjsStateRecord,
  DocumentYjsVersionRecord,
  ProfileRecord,
  WorkspaceRecord
} from "@/types/document";

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: DocumentRecord;
        Insert: Omit<DocumentRecord, "id" | "created_at" | "updated_at" | "last_edited_by"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_edited_by?: string | null;
        };
        Update: Partial<DocumentRecord>;
        Relationships: [];
      };
      document_versions: {
        Row: DocumentVersionRecord;
        Insert: Omit<DocumentVersionRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<DocumentVersionRecord>;
        Relationships: [];
      };
      collaborators: {
        Row: CollaboratorRecord;
        Insert: Omit<CollaboratorRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<CollaboratorRecord>;
        Relationships: [];
      };
      workspaces: {
        Row: WorkspaceRecord;
        Insert: Omit<WorkspaceRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<WorkspaceRecord>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRecord;
        Insert: Omit<ProfileRecord, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProfileRecord>;
        Relationships: [];
      };
      document_yjs_state: {
        Row: DocumentYjsStateRecord;
        Insert: Omit<DocumentYjsStateRecord, "updated_at" | "version"> & {
          updated_at?: string;
          version?: number;
        };
        Update: Partial<DocumentYjsStateRecord>;
        Relationships: [];
      };
      document_yjs_versions: {
        Row: DocumentYjsVersionRecord;
        Insert: Omit<DocumentYjsVersionRecord, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<DocumentYjsVersionRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
