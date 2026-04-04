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
  const value = statusMap[status];

  return (
    <Badge variant={value.variant} className="gap-1.5">
      {value.icon}
      {value.label}
    </Badge>
  );
}