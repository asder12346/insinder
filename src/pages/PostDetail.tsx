import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, ArrowLeft, Twitter, Facebook, Linkedin, Link2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  status: string;
}

interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, signIn } = useAuth();
  
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    async function fetchPostAndComments() {
      if (!id) return;
      try {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (postError) {
          throw postError;
        }
        
        if (postData) {
          setPost(postData);
          
          // Fetch comments
          const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', id)
            .order('created_at', { ascending: true });
            
          if (!commentsError && commentsData) {
            setComments(commentsData);
          }
        }
      } catch (error) {
        console.error('Error fetching post data:', error);
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
        post_id: id,
        content: newComment.trim(),
        author_id: user.id,
        author_name: user.email?.split('@')[0] || 'Anonymous',
      };
      
      const { data, error } = await supabase
        .from('comments')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;
      
      setComments([...comments, data]);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment.');
    }
  };

  const handleEditComment = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editContent.trim() })
        .eq('id', commentId);
      
      if (error) throw error;
      setComments(comments.map(c => c.id === commentId ? { ...c, content: editContent.trim() } : c));
      setEditingCommentId(null);
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment.');
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
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
          src={post.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80'}
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
            Published on {post.created_at ? format(new Date(post.created_at), 'MMMM d, yyyy') : 'Unknown'}
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
            <div key={comment.id} className="border-l-2 border-black pl-4 py-2 mb-6 group relative">
              {editingCommentId === comment.id ? (
                 <form onSubmit={(e) => handleEditComment(e, comment.id)} className="flex flex-col gap-2">
                   <textarea
                     className="block w-full border border-gray-300 focus:border-[#1A1A1A] focus:ring-[#1A1A1A] font-sans sm:text-sm p-3 resize-none bg-transparent"
                     value={editContent}
                     onChange={(e) => setEditContent(e.target.value)}
                     rows={2}
                   />
                   <div className="flex gap-2 justify-end">
                     <button type="button" onClick={() => setEditingCommentId(null)} className="text-xs uppercase tracking-widest font-sans font-bold opacity-60 hover:opacity-100">Cancel</button>
                     <button type="submit" className="bg-black text-white px-4 py-2 text-xs uppercase tracking-widest font-sans font-bold hover:bg-gray-800">Save</button>
                   </div>
                 </form>
              ) : (
                <>
                  <p className="text-sm italic mb-2 font-serif text-[#1A1A1A]">"{comment.content}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-bold uppercase opacity-60">
                      — {comment.author_name} • {format(new Date(comment.created_at || Date.now()), 'MMM d, yyyy')}
                    </span>
                    {(user?.id === comment.author_id || isAdmin) && (
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user?.id === comment.author_id && (
                          <button onClick={() => startEditComment(comment)} className="text-[10px] font-sans uppercase font-bold text-gray-500 hover:text-black">Edit</button>
                        )}
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-[10px] font-sans uppercase font-bold text-red-500 hover:text-red-700">Delete</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
