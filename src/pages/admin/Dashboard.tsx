import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminPosts() {
      if (!user) return;
      try {
        // Admin can list their posts
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setPosts(data || []);
      } catch (error) {
         console.error('Error fetching admin posts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminPosts();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-full flex-grow bg-[#F9F8F6]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1A1A]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-serif flex flex-col flex-grow w-full">
      <header className="border-b border-[#1A1A1A] px-10 py-8 flex items-center justify-between shrink-0">
        <h1 className="text-4xl font-bold uppercase tracking-tight">My Stories</h1>
        <Link
          to="/admin/create"
          className="font-sans text-[10px] uppercase font-bold border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
        >
          New Post
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 w-full flex-grow flex flex-col">
        <div className="mb-8 p-6 border border-[#1A1A1A] bg-white font-sans text-xs uppercase tracking-widest text-[#1A1A1A]">
          Manage your published stories and drafts.
        </div>

        <div className="border border-[#1A1A1A] bg-white flex-grow flex flex-col">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#1A1A1A] font-sans font-bold text-[10px] uppercase tracking-widest bg-[#F9F8F6]">
            <div className="col-span-8">Title</div>
            <div className="col-span-2">Mod State</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <div className="p-8 text-center font-sans tracking-widest text-xs uppercase opacity-50">No records found. Create a new post.</div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-8 font-serif text-lg font-bold uppercase truncate pr-4 text-[#1A1A1A]">
                    {post.title}
                  </div>
                  <div className="col-span-2">
                    <span className="font-sans text-[10px] uppercase tracking-widest font-bold border border-black px-2 py-1">
                      {post.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <Link
                      to={`/admin/edit/${post.id}`}
                      className="font-sans text-[10px] uppercase tracking-widest font-bold border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors text-center"
                    >
                      Modify
                    </Link>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this post?')) {
                          try {
                            const { error } = await supabase.from('posts').delete().eq('id', post.id);
                            if (error) throw error;
                            setPosts(posts.filter(p => p.id !== post.id));
                          } catch (err) {
                            console.error('Error deleting post:', err);
                            alert('Failed to delete post.');
                          }
                        }
                      }}
                      className="font-sans text-[10px] uppercase tracking-widest font-bold border border-red-500 text-red-500 px-4 py-2 hover:bg-red-500 hover:text-white transition-colors text-center cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
