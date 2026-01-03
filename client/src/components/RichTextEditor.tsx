import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  BoldIcon,
  CodeBracketIcon,
  ItalicIcon,
  LinkIcon,
  ListBulletIcon,
  PhotoIcon,
  UnderlineIcon
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = '开始输入...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      try {
        onChange(editor.getHTML());
      } catch (error) {
        console.error('Editor update error:', error);
      }
    },
  }, []);

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center text-gray-400">
        加载中...
      </div>
    );
  }

  const addLink = () => {
    const url = window.prompt('输入链接URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('输入图片URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* 工具栏 */}
      {editable && (
        <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bold') ? 'bg-gray-200' : ''
            }`}
            title="粗体"
          >
            <BoldIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('italic') ? 'bg-gray-200' : ''
            }`}
            title="斜体"
          >
            <ItalicIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('strike') ? 'bg-gray-200' : ''
            }`}
            title="删除线"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-3 py-2 rounded hover:bg-gray-200 text-sm font-medium ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
            }`}
            title="标题1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-2 rounded hover:bg-gray-200 text-sm font-medium ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
            }`}
            title="标题2"
          >
            H2
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-200' : ''
            }`}
            title="无序列表"
          >
            <ListBulletIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('codeBlock') ? 'bg-gray-200' : ''
            }`}
            title="代码块"
          >
            <CodeBracketIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={addLink}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('link') ? 'bg-gray-200' : ''
            }`}
            title="添加链接"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-gray-200"
            title="添加图片"
          >
            <PhotoIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 编辑器内容 */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  );
}





