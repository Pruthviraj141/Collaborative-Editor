"use client";

import { Plus, Type, PenSquare } from "lucide-react";
import type { Editor } from "@tiptap/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DIAGRAM_TEMPLATES } from "@/lib/diagram/templates";

interface EditorQuickInsertProps {
  editor: Editor;
  canWrite: boolean;
}

export function EditorQuickInsert({ editor, canWrite }: EditorQuickInsertProps) {
  const insertTextBlock = () => {
    editor.chain().focus().insertContent({ type: "paragraph" }).run();
  };

  const insertDiagramBlock = () => {
    editor.chain().focus().insertDiagram().run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canWrite} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={insertTextBlock}>
          <Type className="mr-2 h-4 w-4" />
          Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={insertDiagramBlock}>
          <PenSquare className="mr-2 h-4 w-4" />
          Diagram
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Template</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {DIAGRAM_TEMPLATES.filter((item) => item.key !== "blank").map((template) => (
              <DropdownMenuItem
                key={template.key}
                onClick={() => {
                  editor.chain().focus().insertDiagramTemplate(template.key).run();
                }}
              >
                {template.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          Tip: type /diagram, /flowchart, /mindmap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
