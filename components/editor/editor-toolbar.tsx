"use client";

import { Heading1, Heading2, List, ListOrdered, Quote, Redo2, RotateCcw, Code2, Bold, Italic, PenSquare } from "lucide-react";
import type { Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EditorToolbarProps {
  editor: Editor;
  canWrite: boolean;
  onAiDiagram?: () => void;
}

interface ToolbarAction {
  key: string;
  label: string;
  icon: JSX.Element;
  run: () => void;
  isActive?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
}

export function EditorToolbar({ editor, canWrite, onAiDiagram }: EditorToolbarProps) {
  const hasUndo = Object.prototype.hasOwnProperty.call(editor.commands, "undo");
  const hasRedo = Object.prototype.hasOwnProperty.call(editor.commands, "redo");

  const canUndo = hasUndo ? editor.can().chain().focus().undo().run() : false;
  const canRedo = hasRedo ? editor.can().chain().focus().redo().run() : false;

  const actions: ToolbarAction[] = [
    {
      key: "bold",
      label: "Bold",
      icon: <Bold className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold")
    },
    {
      key: "italic",
      label: "Italic",
      icon: <Italic className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic")
    },
    {
      key: "h1",
      label: "Heading 1",
      icon: <Heading1 className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 })
    },
    {
      key: "h2",
      label: "Heading 2",
      icon: <Heading2 className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 })
    },
    {
      key: "bullet-list",
      label: "Bullet list",
      icon: <List className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList")
    },
    {
      key: "ordered-list",
      label: "Ordered list",
      icon: <ListOrdered className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList")
    },
    {
      key: "blockquote",
      label: "Blockquote",
      icon: <Quote className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote")
    },
    {
      key: "code",
      label: "Code block",
      icon: <Code2 className="h-4 w-4" />,
      run: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock")
    },
    {
      key: "diagram",
      label: "Insert diagram",
      icon: <PenSquare className="h-4 w-4" />,
      run: () => editor.chain().focus().insertDiagram().run(),
      disabled: !editor.can().chain().focus().insertDiagram().run()
    },
    {
      key: "ai-diagram",
      label: "AI Diagram",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" fill="currentColor" />
          <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z" fill="currentColor" />
        </svg>
      ),
      run: () => onAiDiagram?.(),
      disabled: !onAiDiagram,
      showLabel: true
    },
    {
      key: "undo",
      label: "Undo",
      icon: <RotateCcw className="h-4 w-4" />,
      run: () => {
        if (!hasUndo) {
          return;
        }

        editor.chain().focus().undo().run();
      },
      disabled: !canUndo
    },
    {
      key: "redo",
      label: "Redo",
      icon: <Redo2 className="h-4 w-4" />,
      run: () => {
        if (!hasRedo) {
          return;
        }

        editor.chain().focus().redo().run();
      },
      disabled: !canRedo
    }
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="hide-scrollbar sticky top-2 z-20 flex items-center gap-1 overflow-x-auto rounded-xl border border-border/80 bg-background/90 p-2 shadow-sm backdrop-blur">
        {actions.map((action, index) => (
          <div key={action.key} className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={action.isActive ? "secondary" : "ghost"}
                  size={action.showLabel ? "sm" : "icon"}
                  onClick={action.run}
                  disabled={!canWrite || action.disabled}
                  aria-label={action.label}
                  className={action.showLabel ? "gap-2 px-2.5" : undefined}
                >
                  {action.icon}
                  {action.showLabel ? <span className="hidden sm:inline">{action.label}</span> : null}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
            {index === 1 || index === 3 || index === 9 ? <Separator orientation="vertical" className="mx-1 h-5" /> : null}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}