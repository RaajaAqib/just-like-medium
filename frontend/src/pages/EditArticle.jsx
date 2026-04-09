import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { FiX, FiUpload } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export default function EditArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [newCoverImage, setNewCoverImage] = useState(null);
  const [published, setPublished] = useState(true);
  const [postSlug, setPostSlug] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/id/${id}`);
        const p = res.data.post;
        setTitle(p.title);
        setContent(p.content);
        setTags(p.tags || []);
        setCoverPreview(p.coverImage || '');
        setPublished(p.published);
        setPostSlug(p.slug);
      } catch {
        toast.error('Failed to load post');
        navigate('/my-stories');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPost();
  }, [id, user]);

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag) && tags.length < 5) setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Please enter a title');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content);
      formData.append('published', published);
      tags.forEach((tag) => formData.append('tags[]', tag));
      if (newCoverImage) formData.append('coverImage', newCoverImage);

      const res = await api.put(`/posts/${id}`, formData, {
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
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit story</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <span>Published</span>
            <div
              onClick={() => setPublished(!published)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                published ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${published ? 'translate-x-5' : ''}`} />
            </div>
          </label>
          <button onClick={handleSubmit} disabled={saving} className="btn-green">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="mb-6">
        {coverPreview ? (
          <div className="relative group">
            <img
              src={coverPreview}
              alt="Cover"
              className="w-full h-auto max-h-[500px] object-contain bg-gray-50 rounded-xl"
            />
            <button
              onClick={() => { setNewCoverImage(null); setCoverPreview(''); }}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiX />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition text-gray-400 text-sm">
            <FiUpload className="text-xl" />
            <span>Add a cover photo</span>
            <span className="text-xs text-gray-300">Any size — auto-adjusts to fit</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full text-4xl font-bold font-serif text-gray-900 placeholder-gray-300 border-none outline-none mb-6"
      />

      <div className="flex flex-wrap items-center gap-2 mb-6 p-3 border border-gray-200 rounded-lg min-h-[44px]">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
            {tag}
            <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-gray-400 hover:text-gray-700">
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

      <RichTextEditor content={content} onChange={setContent} />
    </div>
  );
}
