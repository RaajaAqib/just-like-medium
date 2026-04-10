import { useRef, useState } from 'react';
import {
  useEditor, EditorContent,
  NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer, Node,
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
  FiAlignLeft, FiAlignCenter, FiAlignRight, FiExternalLink,
} from 'react-icons/fi';
import { MdFormatListNumbered, MdFormatQuote, MdFormatUnderlined, MdFormatStrikethrough } from 'react-icons/md';
import api from '../utils/axios';

// ── Language list for code block selector ─────────────────────────────────────
const CODE_LANGS = [
  'auto', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'scss',
  'json', 'xml', 'yaml', 'bash', 'shell', 'sql', 'graphql', 'markdown', 'dockerfile',
];

// ── Code block node view with language picker ─────────────────────────────────
function CodeBlockView({ node, updateAttributes }) {
  const language = node.attrs.language || 'auto';
  return (
    <NodeViewWrapper>
      <div className="relative my-5">
        <pre className="!m-0">
          <NodeViewContent as="code" />
        </pre>
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
  addNodeView() { return ReactNodeViewRenderer(CodeBlockView); },
});

// ── Link preview node view (editor) ──────────────────────────────────────────
function LinkPreviewView({ node, deleteNode }) {
  const { url, title, description, image, siteName, domain } = node.attrs;
  return (
    <NodeViewWrapper contentEditable={false}>
      <div className="link-preview-card my-4 group relative" data-drag-handle>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex gap-4 no-underline"
        >
          <div className="flex-1 min-w-0 p-4">
            {siteName && (
              <p className="text-xs text-gray-400 mb-1">{siteName}</p>
            )}
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
              {title || url}
            </p>
            {description && (
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <FiExternalLink className="text-[10px]" />
              {domain || url}
            </p>
          </div>
          {image && (
            <div className="flex-shrink-0 w-28 h-full">
              <img
                src={image}
                alt={title}
                className="w-28 h-full object-cover rounded-r-lg"
              />
            </div>
          )}
        </a>
        {/* Remove button */}
        <button
          contentEditable={false}
          onClick={deleteNode}
          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-gray-400
            hover:text-red-500 transition opacity-0 group-hover:opacity-100"
          title="Remove preview"
        >
          ×
        </button>
      </div>
    </NodeViewWrapper>
  );
}

// ── Link preview Tiptap node definition ──────────────────────────────────────
const LinkPreviewNode = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url:         { default: null },
      title:       { default: null },
      description: { default: null },
      image:       { default: null },
      siteName:    { default: null },
      domain:      { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-link-preview]', getAttrs: el => ({
      url:         el.getAttribute('data-url'),
      title:       el.getAttribute('data-title'),
      description: el.getAttribute('data-description'),
      image:       el.getAttribute('data-image'),
      siteName:    el.getAttribute('data-site-name'),
      domain:      el.getAttribute('data-domain'),
    }) }];
  },

  renderHTML({ HTMLAttributes: a }) {
    // This HTML is stored in the DB and rendered in Article.jsx via dangerouslySetInnerHTML
    const children = [
      ['div', { class: 'link-preview-body' },
        ...(a.siteName ? [['p', { class: 'link-preview-site' }, a.siteName]] : []),
        ['p', { class: 'link-preview-title' }, a.title || a.url || ''],
        ...(a.description ? [['p', { class: 'link-preview-desc' }, a.description]] : []),
        ['p', { class: 'link-preview-domain' }, a.domain || a.url || ''],
      ],
      ...(a.image ? [['img', { src: a.image, alt: a.title || '', class: 'link-preview-image' }]] : []),
    ];

    return ['a', {
      href: a.url,
      target: '_blank',
      rel: 'noopener noreferrer',
      'data-link-preview': 'true',
      'data-url': a.url,
      'data-title': a.title,
      'data-description': a.description,
      'data-image': a.image,
      'data-site-name': a.siteName,
      'data-domain': a.domain,
      class: 'link-preview-card',
    }, ...children];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewView);
  },
});

// ── Toolbar helpers ───────────────────────────────────────────────────────────
const Btn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    title={title}
    className={`px-1.5 py-1 rounded text-sm transition-colors flex-shrink-0 ${
      active
        ? 'bg-gray-900 text-white'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    {children}
  </button>
);
const Sep = () => <span className="w-px h-5 bg-gray-200 mx-1 self-center flex-shrink-0" />;

// ── Is URL string ─────────────────────────────────────────────────────────────
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// ── Insert a link-preview card via the schema directly (position-safe) ────────
function insertPreviewCard(editor, attrs) {
  const { state, view } = editor;
  const nodeType = state.schema.nodes.linkPreview;
  if (!nodeType) return false;
  const node = nodeType.create(attrs);
  const tr = state.tr.replaceSelectionWith(node);
  view.dispatch(tr);
  return true;
}

// ── Editor ────────────────────────────────────────────────────────────────────
export default function RichTextEditor({ content, onChange }) {
  const editorRef   = useRef(null);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockWithPicker.configure({ lowlight, defaultLanguage: null }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Tell your story…' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LinkPreviewNode,
    ],
    content: content || '',
    onCreate: ({ editor: e }) => { editorRef.current = e; },
    onUpdate:  ({ editor: e }) => {
      editorRef.current = e;
      onChange(e.getHTML());
    },
    editorProps: {
      handlePaste(view, event) {
        const text = event.clipboardData?.getData('text/plain')?.trim() || '';
        if (!URL_RE.test(text)) return false; // let Tiptap handle normally

        event.preventDefault();
        const url = text;

        // Show a brief loading state — nothing inserted yet
        setFetchingPreview(true);

        api.get(`/link-preview?url=${encodeURIComponent(url)}`)
          .then(res => {
            const d = res.data;
            const e = editorRef.current;
            if (!e) return;

            if (d.title || d.description || d.image) {
              // Insert the preview card at current cursor
              insertPreviewCard(e, {
                url:         d.url         || url,
                title:       d.title       || '',
                description: d.description || '',
                image:       d.image       || null,
                siteName:    d.siteName    || d.domain || '',
                domain:      d.domain      || '',
              });
            } else {
              // No useful metadata — insert as a plain hyperlink
              e.chain().focus()
                .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
                .run();
            }
          })
          .catch(() => {
            // Network error — insert as plain text hyperlink
            editorRef.current?.chain().focus()
              .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
              .run();
          })
          .finally(() => setFetchingPreview(false));

        return true;
      },
    },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addLinkPreview = async () => {
    const url = window.prompt('Paste a URL to generate a preview card:');
    if (!url || !URL_RE.test(url.trim())) return;
    setFetchingPreview(true);
    try {
      const res = await api.get(`/link-preview?url=${encodeURIComponent(url.trim())}`);
      const d = res.data;
      if (d.title || d.description || d.image) {
        insertPreviewCard(editor, {
          url:         d.url         || url,
          title:       d.title       || '',
          description: d.description || '',
          image:       d.image       || null,
          siteName:    d.siteName    || d.domain || '',
          domain:      d.domain      || '',
        });
      } else {
        alert('Could not fetch a preview for that URL. Try a different link.');
      }
    } catch {
      alert('Failed to fetch link preview. Check the URL and try again.');
    } finally {
      setFetchingPreview(false);
    }
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
      {/* Fetching preview indicator */}
      {fetchingPreview && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-xs text-blue-600 border-b border-blue-100">
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Fetching link preview…
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0 px-2 py-1.5 border-b border-gray-200 bg-gray-50">

        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <strong className="font-extrabold text-[13px]">B</strong>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <em className="font-serif text-[13px] italic">I</em>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <MdFormatUnderlined className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <MdFormatStrikethrough className="text-base" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <span className="font-mono text-[11px] font-semibold">`&nbsp;`</span>
        </Btn>

        <Sep />

        {[1, 2, 3, 4, 5, 6].map(level => (
          <Btn key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            active={editor.isActive('heading', { level })}
            title={`Heading ${level}`}
          >
            <span className={`font-bold leading-none ${level <= 2 ? 'text-[13px]' : 'text-[11px]'}`}>H{level}</span>
          </Btn>
        ))}

        <Sep />

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

        <Btn onClick={addLink} active={editor.isActive('link')} title="Insert link">
          <FiLink className="text-base" />
        </Btn>
        <Btn onClick={addLinkPreview} title="Insert link preview card (or paste a URL directly)">
          <FiExternalLink className="text-base" />
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
