"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface CreateDocumentButtonProps {
  workspaceId: string;
}

export function CreateDocumentButton({ workspaceId }: CreateDocumentButtonProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createDocument = async () => {
    setIsCreating(true);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Untitled document",
          content: "",
          workspaceId
        })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        document?: { id: string };
      };

      if (!response.ok || !payload.document?.id) {
        toast.error("Unable to create document. Please try again.");
        setIsCreating(false);
        return;
      }

      toast.success("Document created successfully.");
      router.push(`/editor?docId=${payload.document.id}`);
      router.refresh();
    } catch {
      toast.error("Unable to create document. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <Button type="button" onClick={() => void createDocument()} disabled={isCreating} className="h-10 rounded-lg px-4 disabled:opacity-50">
      {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {isCreating ? "Creating..." : "New document"}
    </Button>
  );
}
