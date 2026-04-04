import { z } from "zod";

export const documentIdSchema = z.string().uuid();

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().default(""),
  workspaceId: z.string().uuid()
});

export const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(180).optional(),
  content: z.string().optional(),
  isArchived: z.boolean().optional()
});

export const listDocumentsSchema = z.object({
  workspaceId: z.string().uuid().optional()
});