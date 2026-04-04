"use client";

import { useMemo, useState } from "react";

import type { EditorSyncStatus } from "@/types/editor";

export function useEditorState(defaultTitle: string, defaultContent: string) {
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(defaultContent);
  const [status, setStatus] = useState<EditorSyncStatus>("saved");
  const [isDirty, setIsDirty] = useState(false);

  const state = useMemo(
    () => ({
      title,
      content,
      status,
      isDirty
    }),
    [content, isDirty, status, title]
  );

  return {
    state,
    setTitle,
    setContent,
    setStatus,
    setIsDirty
  };
}