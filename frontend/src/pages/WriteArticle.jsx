import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { FiX, FiUpload } from 'react-icons/fi';

export default function WriteArticle() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Please enter a title');
    if (!content || content === '<p></p>') return toast.error('Please write some content');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content);
      formData.append('published', published);
      tags.forEach((tag) => formData.append('tags[]', tag));
      if (coverImage) formData.append('coverImage', coverImage);

      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (published) {
        toast.success('Story published!');
        navigate(`/article/${res.data.post.slug}`);
      } else {
        toast.success('Draft saved!');
        navigate('/my-stories');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Write a story</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <span>Publish</span>
            <div
              onClick={() => setPublished(!published)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                published ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  published ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-green"
          >
            {loading ? 'Publishing...' : published ? 'Publish' : 'Save draft'}
          </button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="mb-6">
        {coverPreview ? (
          <div className="relative">
            <img src={coverPreview} alt="Cover" className="w-full h-56 object-cover rounded-xl" />
            <button
              onClick={() => { setCoverImage(null); setCoverPreview(''); }}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <FiX />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition text-gray-400 text-sm">
            <FiUpload />
            <span>Add a cover image</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full text-4xl font-bold font-serif text-gray-900 placeholder-gray-300 border-none outline-none mb-6 resize-none"
      />

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-3 border border-gray-200 rounded-lg min-h-[44px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-700">
              <FiX className="text-xs" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder={tags.length < 5 ? 'Add tags (press Enter)…' : 'Max 5 tags'}
          disabled={tags.length >= 5}
          className="flex-1 min-w-32 text-sm outline-none bg-transparent placeholder-gray-300"
        />
      </div>

      {/* Rich text editor */}
      <RichTextEditor content={content} onChange={setContent} />
    </div>
  );
}
