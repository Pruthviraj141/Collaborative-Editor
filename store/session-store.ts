"use client";

import { create } from "zustand";

export interface SessionState {
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  setSession: (session: { userId: string; email: string | null } | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: null,
  email: null,
  isAuthenticated: false,
  setSession: (session) => {
    if (!session) {
      set({ userId: null, email: null, isAuthenticated: false });
      return;
    }

    set({ userId: session.userId, email: session.email, isAuthenticated: true });
  }
}));