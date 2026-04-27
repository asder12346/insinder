import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Search } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  author_id: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full flex-grow">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1A1A]"></div>
      </div>
    );
  }

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="mb-12 border-b border-[#1A1A1A] pb-8">
        <h1 className="text-5xl font-bold uppercase font-serif text-[#1A1A1A]">Latest Insights</h1>
        <p className="mt-4 font-sans text-xs uppercase tracking-widest text-[#1A1A1A] opacity-50">Discover thought-provoking articles and ideas.</p>
      </div>

      <div className="relative mb-12 border border-[#1A1A1A] bg-white hover:shadow-md transition-shadow">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-[#1A1A1A] opacity-50" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SEARCH POSTS BY TITLE OR CONTENT..."
          className="w-full pl-12 pr-4 py-4 font-sans text-xs uppercase tracking-widest focus:outline-none focus:ring-none bg-transparent placeholder:text-black/30"
        />
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 border border-[#1A1A1A] shadow-sm bg-white">
          <p className="text-[#1A1A1A] font-sans text-lg uppercase tracking-widest opacity-50">
            {posts.length === 0 ? 'No posts published yet. Check back later!' : 'No posts match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-2">
          {filteredPosts.map((post) => (
            <article key={post.id} className="group relative flex flex-col items-start justify-between bg-white border border-[#1A1A1A] overflow-hidden">
              <div className="relative w-full h-80 bg-gray-100 border-b border-[#1A1A1A] overflow-hidden">
                <img
                  src={post.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80'}
                  alt={post.title}
                  className="absolute inset-0 h-full w-full object-cover grayscale opacity-90 group-hover:grayscale-0 transition-all duration-500 ease-in-out"
                />
              </div>
              <div className="p-8 flex flex-col flex-grow w-full">
                <div className="flex items-center gap-x-4 mb-4 font-sans text-[10px] uppercase tracking-widest font-bold border-b border-gray-200 pb-2 w-full">
                  <span className="flex items-center gap-1 opacity-60">
                    <Calendar size={14} />
                    {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : 'Unknown Date'}
                  </span>
                </div>
                <div className="group relative w-full">
                  <h3 className="text-3xl font-bold leading-tight font-serif uppercase text-[#1A1A1A] group-hover:opacity-70 transition-opacity mb-4 line-clamp-2">
                    <Link to={`/post/${post.id}`}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="font-sans text-sm leading-relaxed text-gray-700 line-clamp-3">
                    {post.content}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
