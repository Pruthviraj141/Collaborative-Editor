"use client";

import { BubbleMenu, type Editor } from "@tiptap/react";
import { Bold, Italic, PenSquare } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorFloatingToolbarProps {
  editor: Editor;
  canWrite: boolean;
}

export function EditorFloatingToolbar({ editor, canWrite }: EditorFloatingToolbarProps) {
  if (!canWrite) {
    return null;
  }

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 120 }} shouldShow={({ editor: instance }) => instance.isFocused}>
      <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-background/95 p-1 shadow-lg backdrop-blur">
        <Button
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().insertDiagram().run()} className="h-8 w-8">
          <PenSquare className="h-3.5 w-3.5" />
        </Button>
      </div>
    </BubbleMenu>
  );
}
