"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, WifiOff, Radio, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EditorSyncStatus } from "@/types/editor";

interface EditorStatusProps {
  status: EditorSyncStatus;
}

const statusMap: Record<EditorSyncStatus, { label: string; icon: JSX.Element; variant: "secondary" | "success" | "outline" }> = {
  saved: {
    label: "Saved",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "success"
  },
  syncing: {
    label: "Syncing",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    variant: "secondary"
  },
  "read-only": {
    label: "Read-only",
    icon: <WifiOff className="h-3 w-3" />,
    variant: "outline"
  },
  error: {
    label: "Save failed",
    icon: <ShieldAlert className="h-3 w-3" />,
    variant: "outline"
  },
  connected: {
    label: "Connected",
    icon: <Radio className="h-3 w-3" />,
    variant: "success"
  },
  reconnecting: {
    label: "Reconnecting",
    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
    variant: "secondary"
  },
  offline: {
    label: "Offline",
    icon: <WifiOff className="h-3 w-3" />,
    variant: "outline"
  }
};

export function EditorStatus({ status }: EditorStatusProps) {
  const [showSavedFlash, setShowSavedFlash] = useState(false);

  useEffect(() => {
    if (status !== "saved") {
      return;
    }

    setShowSavedFlash(true);
    const timer = setTimeout(() => setShowSavedFlash(false), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const value = statusMap[status];

  const label = useMemo(() => {
    if (status === "syncing") {
      return (
        <span className="inline-flex items-center">
          Saving
          <span className="saving-dots ml-1 inline-flex">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </span>
      );
    }

    if (status === "saved") {
      return <span className={`transition-opacity duration-300 ${showSavedFlash ? "opacity-100" : "opacity-80"}`}>Saved ✓</span>;
    }

    if (status === "error") {
      return <span className="text-destructive-foreground">Failed to save</span>;
    }

    return <span>{value.label}</span>;
  }, [showSavedFlash, status, value.label]);

  return (
    <Badge variant={value.variant} className="gap-1.5 transition-all duration-200">
      {value.icon}
      {label}
    </Badge>
  );
}