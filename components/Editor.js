'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

function ToolbarButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-accent text-white'
          : 'text-ink/70 hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent'
      }`}
    >
      {children}
    </button>
  );
}

export default function Editor({ initialContent, editable, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent || '<p></p>',
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-editor px-1 py-2 max-w-none',
      },
    },
  });

  // Keep the editor's editable flag in sync (e.g. view-only shared docs).
  useEffect(() => {
    if (editor) editor.setEditable(!!editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div>
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b border-black/10 pb-2 mb-3 sticky top-0 bg-paper/95 backdrop-blur z-10">
          <ToolbarButton
            label="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className="font-bold">B</span>
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className="italic">I</span>
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <div className="w-px h-5 bg-black/10 mx-1" />
          <ToolbarButton
            label="Heading 1"
            active={editor.isActive('heading', { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            label="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            label="Paragraph"
            active={editor.isActive('paragraph')}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            ¶
          </ToolbarButton>
          <div className="w-px h-5 bg-black/10 mx-1" />
          <ToolbarButton
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </ToolbarButton>
          <div className="w-px h-5 bg-black/10 mx-1" />
          <ToolbarButton
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            ↺
          </ToolbarButton>
          <ToolbarButton
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            ↻
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} className="ProseMirror-wrapper" />
    </div>
  );
}
