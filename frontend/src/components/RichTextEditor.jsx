import {
  useEditor, EditorContent,
  NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import {
  FiBold, FiItalic, FiList, FiLink, FiImage, FiMinus,
  FiAlignLeft, FiAlignCenter, FiAlignRight,
} from 'react-icons/fi';
import { MdFormatListNumbered, MdFormatQuote, MdFormatUnderlined, MdFormatStrikethrough } from 'react-icons/md';
import api from '../utils/axios';

// ── Language list for code block selector ────────────────────────────────────
const CODE_LANGS = [
  'auto', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'scss',
  'json', 'xml', 'yaml', 'bash', 'shell', 'sql', 'graphql', 'markdown', 'dockerfile',
];

// ── Custom code-block node view with language picker ─────────────────────────
function CodeBlockView({ node, updateAttributes }) {
  const language = node.attrs.language || 'auto';
  return (
    <NodeViewWrapper>
      <div className="relative my-5">
        <pre className="!m-0">
          <NodeViewContent as="code" />
        </pre>
        {/* language selector — bottom-right, non-editable */}
        <div className="absolute bottom-2.5 right-3 z-10" contentEditable={false}>
          <select
            value={language}
            onChange={e => updateAttributes({ language: e.target.value === 'auto' ? null : e.target.value })}
            onMouseDown={e => e.stopPropagation()}
            className="text-[11px] bg-gray-800 text-gray-400 border border-gray-600 rounded px-2 py-0.5 focus:outline-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
          >
            {CODE_LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

const CodeBlockWithPicker = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

// ── Toolbar helpers ───────────────────────────────────────────────────────────
const Btn = ({ onClick, active, title, children, className = '' }) => (
  <button
    type="button"
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    title={title}
    className={`px-1.5 py-1 rounded text-sm transition-colors flex-shrink-0 ${
      active
        ? 'bg-gray-900 text-white'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    } ${className}`}
  >
    {children}
  </button>
);

const Sep = () => <span className="w-px h-5 bg-gray-200 mx-1 self-center flex-shrink-0" />;

// ── Editor ────────────────────────────────────────────────────────────────────
export default function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockWithPicker.configure({ lowlight, defaultLanguage: null }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Tell your story…' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('coverImage', file);
      try {
        const res = await api.post('/posts/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        editor.chain().focus().setImage({ src: res.data.url }).run();
      } catch {
        const reader = new FileReader();
        reader.onload = ev => editor.chain().focus().setImage({ src: ev.target.result }).run();
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0 px-2 py-1.5 border-b border-gray-200 bg-gray-50">

        {/* Text formatting */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <strong className="font-extrabold text-[13px]">B</strong>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <em className="font-serif text-[13px] not-italic italic">I</em>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <MdFormatUnderlined className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <MdFormatStrikethrough className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <span className="font-mono text-[11px] font-semibold">`&nbsp;`</span>
        </Btn>

        <Sep />

        {/* Headings H1–H6 */}
        {[1, 2, 3, 4, 5, 6].map(level => (
          <Btn
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            active={editor.isActive('heading', { level })}
            title={`Heading ${level}`}
            className={level >= 4 ? 'text-xs' : ''}
          >
            <span className={`font-bold leading-none ${level <= 2 ? 'text-[13px]' : 'text-[11px]'}`}>H{level}</span>
          </Btn>
        ))}

        <Sep />

        {/* Lists & blocks */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <FiList className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <MdFormatListNumbered className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <MdFormatQuote className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          <span className="font-mono text-[11px] font-semibold">{'</>'}</span>
        </Btn>

        <Sep />

        {/* Alignment */}
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <FiAlignLeft className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          <FiAlignCenter className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <FiAlignRight className="text-base" />
        </Btn>

        <Sep />

        {/* Insert */}
        <Btn onClick={addLink} active={editor.isActive('link')} title="Insert link">
          <FiLink className="text-base" />
        </Btn>
        <Btn onClick={addImage} title="Insert image">
          <FiImage className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal divider">
          <FiMinus className="text-base" />
        </Btn>
      </div>

      {/* ── Editor body ── */}
      <EditorContent
        editor={editor}
        className="prose-editor px-7 pt-8 pb-8 min-h-[420px]"
      />
    </div>
  );
}
