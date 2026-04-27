import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrorHandler';
import { useNavigate, Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2 } from 'lucide-react';

export default function AdminEditPost() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!id || !user || !isAdmin) return;
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title);
          setContent(data.content);
          setImageUrl(data.imageUrl);
          setStatus(data.status);
        } else {
          navigate('/admin');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `posts/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id, user, isAdmin, navigate]);

  if (authLoading || loading) return <div className="min-h-screen bg-[#F9F8F6]" />;
  if (!user || !isAdmin) return <Navigate to="/" />;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `blog_images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImageUrl(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please check your Firebase Storage security rules or connection.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !title || !content || !imageUrl) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'posts', id);
      const payload = {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim(),
        status,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, payload);
      navigate('/admin');
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you strictly sure you want to delete this editorial publication? This is permanent.')) return;
    
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', id));
      navigate('/admin');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] flex flex-col font-serif w-full">
      <nav className="h-20 border-b border-[#1A1A1A] flex items-center justify-between px-10 shrink-0 bg-[#F9F8F6]">
        <div className="flex items-baseline space-x-4">
          <span className="text-2xl font-bold tracking-tight uppercase border-r border-[#1A1A1A] pr-4">Debian Admin</span>
          <span className="hidden sm:inline text-xs font-sans uppercase tracking-widest text-[#1A1A1A] opacity-50 pl-4">Content Management / Edit Post</span>
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="font-sans text-[10px] uppercase font-bold text-black opacity-50 hover:opacity-100 hover:text-red-600 transition-colors flex flex-row items-center gap-1"
          >
            <Trash2 size={12} />
            Delete
          </button>
          <Link to="/admin" className="font-sans text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Back to Dashboard</Link>
        </div>
      </nav>

      <form onSubmit={handleUpdate} className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-[calc(100vh-80px)]">
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
              <span>Feature Image</span>
              {uploading && <span className="opacity-50">Uploading...</span>}
            </div>
            
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`w-full aspect-video border border-dashed ${imageUrl ? 'border-transparent' : 'border-[#1A1A1A]'} flex flex-col items-center justify-center cursor-pointer relative overflow-hidden bg-[#F9F8F6] hover:bg-gray-50 transition-colors group mb-6`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              
              {imageUrl ? (
                <>
                  <div className="absolute inset-0 bg-[#00000005] mix-blend-multiply z-10"></div>
                  <img src={imageUrl} alt="Preview" className="absolute inset-0 h-full w-full object-cover grayscale opacity-90 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <span className="text-white font-sans text-xs uppercase tracking-widest font-bold bg-black/60 px-4 py-2">
                      {uploading ? 'Uploading...' : 'Replace Image'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className={`p-4 bg-white border border-[#1A1A1A] rounded-full transition-transform ${uploading ? 'animate-bounce' : 'group-hover:-translate-y-1'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1A1A1A]">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </span>
                  <span className="font-sans text-xs uppercase tracking-widest opacity-60">
                    {uploading ? 'Uploading...' : 'Click to upload from device'}
                  </span>
                </div>
              )}
            </div>
            
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
              {saving ? 'Updating...' : 'Update Publication'}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
