import { useState, FormEvent } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrorHandler';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminCreatePost() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [saving, setSaving] = useState(false);

  if (authLoading) return <div className="min-h-screen bg-[#F9F8F6]" />;
  if (!user || !isAdmin) return <Navigate to="/" />;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !content || !imageUrl) {
      alert('All fields are required.');
      return;
    }
    
    setSaving(true);
    try {
      const newPostRef = doc(collection(db, 'posts'));
      const now = new Date().toISOString();
      const payload = {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim(),
        authorId: user.uid,
        status,
        createdAt: now,
        updatedAt: now
      };
      
      await setDoc(newPostRef, payload);
      navigate('/admin');
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'posts');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] flex flex-col font-serif w-full">
      <nav className="h-20 border-b border-[#1A1A1A] flex items-center justify-between px-10 shrink-0 bg-[#F9F8F6]">
        <div className="flex items-baseline space-x-4">
          <span className="text-2xl font-bold tracking-tight uppercase border-r border-[#1A1A1A] pr-4">Debian Admin</span>
          <span className="hidden sm:inline text-xs font-sans uppercase tracking-widest text-[#1A1A1A] opacity-50 pl-4">Content Management / New Post</span>
        </div>
        <Link to="/admin" className="font-sans text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Back to Dashboard</Link>
      </nav>

      <form onSubmit={handleSave} className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-[calc(100vh-80px)]">
        <section className="lg:w-[60%] p-10 border-r border-[#1A1A1A] flex flex-col overflow-y-auto w-full">
          <div className="mb-12 border-b border-[#1A1A1A] pb-8">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-5xl font-bold uppercase placeholder-gray-300 focus:outline-none leading-tight"
              placeholder="ENTER TITLE..."
              required
            />
          </div>
          
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[400px] bg-transparent font-sans text-lg text-gray-700 leading-relaxed focus:outline-none resize-none placeholder-gray-300"
              placeholder="Write for the community... (Markdown/Text)"
              required
            />
          </div>
        </section>

        <section className="lg:w-[40%] bg-white flex flex-col overflow-y-auto w-full">
          <div className="p-8 border-b border-[#1A1A1A]">
            <div className="flex justify-between items-center mb-6 uppercase text-[10px] font-sans tracking-widest font-bold">
              <span>Feature Image URL</span>
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full font-sans text-xs p-4 border border-[#1A1A1A] focus:outline-none mb-6 placeholder-gray-300 bg-[#F9F8F6]"
              placeholder="https://images.unsplash.com/..."
              required
            />
            {imageUrl && (
              <div className="aspect-video bg-gray-100 border border-dashed border-[#1A1A1A] flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[#00000005] mix-blend-multiply"></div>
                <img src={imageUrl} alt="Preview" className="absolute inset-0 h-full w-full object-cover grayscale opacity-90" />
              </div>
            )}
            
            <div className="mt-10">
              <div className="flex justify-between items-center mb-6 uppercase text-[10px] font-sans tracking-widest font-bold">
                <span>Publish Status</span>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full font-sans text-xs p-4 border border-[#1A1A1A] focus:outline-none uppercase bg-[#F9F8F6]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="flex-1 p-8 flex flex-col justify-end mt-auto space-y-4 bg-white">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-black text-white font-sans uppercase text-xs tracking-widest py-5 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish to Debian Blog'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
