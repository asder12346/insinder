import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrorHandler';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, ArrowLeft, Twitter, Facebook, Linkedin, Link2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  status: string;
}

interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signIn } = useAuth();
  
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function fetchPostAndComments() {
      if (!id) return;
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() } as Post);
          
          // Fetch comments
          const q = query(
            collection(db, `posts/${id}/comments`),
            orderBy('createdAt', 'asc')
          );
          const commentsSnap = await getDocs(q);
          const commentsData = commentsSnap.docs.map(c => ({ id: c.id, ...c.data() } as Comment));
          setComments(commentsData);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `posts/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchPostAndComments();
  }, [id]);

  const handlePostComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !user || !newComment.trim() || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      const payload = {
        postId: id,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, `posts/${id}/comments`), payload);
      setComments([...comments, { 
        id: docRef.id, 
        ...payload, 
        createdAt: { toDate: () => new Date() } // Simulate Firestore Timestamp for local display
      } as any]);
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${id}/comments`);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full flex-grow">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(post?.title || 'Check out this post');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center font-serif">
        <h2 className="text-5xl font-bold uppercase text-[#1A1A1A]">Post not found</h2>
        <Link to="/" className="text-black hover:text-gray-600 mt-4 inline-block font-sans uppercase tracking-widest text-xs border-b border-black">Return home</Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full font-serif">
      <Link to="/" className="inline-flex items-center font-sans text-[10px] uppercase tracking-widest font-bold opacity-50 hover:opacity-100 mb-8 transition-opacity border border-black px-4 py-2">
        <ArrowLeft size={16} className="mr-2" />
        Back to articles
      </Link>
      
      <div className="relative w-full h-[400px] mb-12 border border-[#1A1A1A] overflow-hidden bg-gray-100">
        <img
          src={post.imageUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80'}
          alt={post.title}
          className="absolute inset-0 h-full w-full object-cover grayscale opacity-90 hover:grayscale-0 transition-opacity"
        />
      </div>

      <header className="mb-10 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-7xl font-bold uppercase font-serif text-[#1A1A1A] mb-8 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-x-4 font-sans text-xs uppercase tracking-widest text-[#1A1A1A] opacity-60 border-t border-b border-[#1A1A1A] py-4 mb-10">
          <span className="flex items-center gap-1.5">
            <Calendar size={16} />
            Published on {post.createdAt ? format(new Date(post.createdAt), 'MMMM d, yyyy') : 'Unknown'}
          </span>
        </div>
      </header>

      <div className="mx-auto font-sans text-lg text-gray-700 leading-relaxed max-w-3xl mb-16 whitespace-pre-wrap first-letter:text-7xl first-letter:font-serif first-letter:mr-3 first-letter:float-left">
        {post.content}
      </div>

      {/* Share Section */}
      <div className="max-w-3xl mx-auto mb-16 py-6 border-t border-b border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-sans text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A]">Share this article</span>
        <div className="flex items-center gap-4">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 border border-[#1A1A1A] hover:bg-black hover:text-white transition-colors flex items-center justify-center opacity-70 hover:opacity-100"
            aria-label="Share on Twitter"
          >
            <Twitter size={18} />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 border border-[#1A1A1A] hover:bg-black hover:text-white transition-colors flex items-center justify-center opacity-70 hover:opacity-100"
            aria-label="Share on Facebook"
          >
            <Facebook size={18} />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 border border-[#1A1A1A] hover:bg-black hover:text-white transition-colors flex items-center justify-center opacity-70 hover:opacity-100"
            aria-label="Share on LinkedIn"
          >
            <Linkedin size={18} />
          </a>
          <button
            onClick={handleCopyLink}
            className="p-3 border border-[#1A1A1A] hover:bg-black hover:text-white transition-colors flex items-center justify-center opacity-70 hover:opacity-100"
            aria-label="Copy Link"
          >
            <Link2 size={18} />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <section className="max-w-3xl mx-auto border-t border-[#1A1A1A] pt-10 mt-10">
        <h3 className="font-sans text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A] mb-8 border-b border-[#1A1A1A] pb-4">Recent Comments ({comments.length})</h3>
        
        {user ? (
          <form onSubmit={handlePostComment} className="mb-10 p-6 border border-[#1A1A1A] bg-transparent">
            <label htmlFor="comment" className="sr-only">Add your comment</label>
            <textarea
              id="comment"
              rows={3}
              className="block w-full border border-gray-300 focus:border-[#1A1A1A] focus:ring-[#1A1A1A] font-sans sm:text-sm p-4 resize-none bg-transparent"
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="w-full sm:w-auto bg-black text-white font-sans uppercase text-xs tracking-widest px-8 py-4 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-10 p-8 text-center border border-[#1A1A1A]">
            <p className="font-sans text-xs uppercase tracking-widest text-[#1A1A1A] mb-4 font-bold">Join the conversation</p>
            <button
              onClick={signIn}
              className="inline-flex items-center px-6 py-3 border border-black font-sans text-xs uppercase tracking-widest font-bold text-black bg-transparent hover:bg-black hover:text-white transition-colors"
            >
              Sign in to comment
            </button>
          </div>
        )}

        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-black pl-4 py-2 mb-6">
              <p className="text-sm italic mb-2 font-serif text-[#1A1A1A]">"{comment.content}"</p>
              <span className="text-[10px] font-sans font-bold uppercase opacity-60">
                — {comment.authorName} • {format(comment.createdAt && (comment.createdAt as any).toDate ? (comment.createdAt as any).toDate() : new Date(comment.createdAt || Date.now()), 'MMM d, yyyy')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
