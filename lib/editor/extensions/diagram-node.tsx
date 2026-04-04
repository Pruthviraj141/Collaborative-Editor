"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeSelection, Plugin, PluginKey, TextSelection } from "prosemirror-state";
import type * as Y from "yjs";

import { DiagramNodeViewMemo } from "@/components/diagram/diagram-node-view";
import type { DiagramTemplateKey } from "@/lib/diagram/templates";
import {
  deleteDiagramContent,
  DIAGRAM_ORIGINS,
  getDiagramContent,
  listDiagramBlockIds,
  setDiagramContent
} from "@/lib/collab/diagram-state";
import { DEFAULT_DIAGRAM_LAYOUT_SETTINGS } from "@/types/diagram";

interface DiagramNodeOptions {
  yDoc: Y.Doc | null;
  canEdit: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    diagram: {
      insertDiagram: () => ReturnType;
      insertDiagramTemplate: (template: DiagramTemplateKey) => ReturnType;
    };
  }
}

export const DiagramNode = Node.create<DiagramNodeOptions>({
  name: "diagram",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      yDoc: null,
      canEdit: false
    };
  },

  addAttributes() {
    return {
      blockId: {
        default: ""
      },
      templateKey: {
        default: "blank"
      },
      initialElements: {
        default: null
      }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="diagram"]' }, { tag: 'div[data-type="diagram-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "diagram" })];
  },

  addCommands() {
    return {
      insertDiagram:
        () =>
        ({ commands }) => {
          return commands.insertDiagramTemplate("blank");
        },
      insertDiagramTemplate:
        (template) =>
        ({ commands, tr }) => {
          if (!this.options.canEdit) {
            return false;
          }

          const blockId = crypto.randomUUID();

          if (this.options.yDoc && !getDiagramContent(this.options.yDoc, blockId)) {
            setDiagramContent(this.options.yDoc, blockId, {
              elements: [],
              appState: {},
              files: {},
              metadata: {
                updatedAt: new Date().toISOString(),
                layoutSettings: DEFAULT_DIAGRAM_LAYOUT_SETTINGS,
                arrowConnections: {}
              }
            }, DIAGRAM_ORIGINS.LOCAL_EXCALIDRAW);
          }

          const inserted = commands.insertContent({
            type: this.name,
            attrs: { blockId, templateKey: template }
          });

          if (!inserted && this.options.yDoc) {
            deleteDiagramContent(this.options.yDoc, blockId, DIAGRAM_ORIGINS.GC);
          }

          if (inserted) {
            tr.scrollIntoView();
          }

          return inserted;
        }
    };
  },

  addKeyboardShortcuts() {
    const moveSelection = (direction: 1 | -1) => {
      const { selection, doc, tr } = this.editor.state;
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== this.name) {
        return false;
      }

      const basePos = direction > 0 ? selection.$from.pos + selection.node.nodeSize : selection.$from.pos;
      const targetPos = Math.max(1, Math.min(basePos, doc.content.size));
      const nextSelection = TextSelection.near(doc.resolve(targetPos), direction);
      this.editor.view.dispatch(tr.setSelection(nextSelection).scrollIntoView());
      return true;
    };

    return {
      ArrowDown: () => moveSelection(1),
      ArrowUp: () => moveSelection(-1),
      Enter: () => {
        const { selection } = this.editor.state;
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== this.name) {
          return false;
        }

        return this.editor
          .chain()
          .focus(selection.$to.pos)
          .insertContent({ type: "paragraph" })
          .run();
      },
      Backspace: () => {
        const { selection } = this.editor.state;
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== this.name) {
          return false;
        }

        return this.editor.chain().focus().deleteSelection().run();
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("diagram-gc"),
        appendTransaction: () => {
          const yDoc = this.options.yDoc;
          if (!yDoc) {
            return null;
          }

          const liveIds = new Set<string>();
          this.editor.state.doc.descendants((node) => {
            if (node.type.name !== this.name) {
              return true;
            }

            const blockId = String(node.attrs.blockId ?? "");
            if (blockId) {
              liveIds.add(blockId);
            }

            return false;
          });

          for (const blockId of listDiagramBlockIds(yDoc)) {
            if (!liveIds.has(blockId)) {
              deleteDiagramContent(yDoc, blockId, DIAGRAM_ORIGINS.GC);
            }
          }

          return null;
        }
      })
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <DiagramNodeViewMemo props={props} yDoc={this.options.yDoc} canEdit={this.options.canEdit} />
    ));
  }
});
