import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdmin(currentUser);
    }).catch((error) => {
      console.error("Error checking session:", error);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkAdmin(currentUser);
      if (currentUser) {
        setIsLoginModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (currentUser: User | null) => {
    if (currentUser) {
      if (currentUser.email === 'samuelabedecornelius@gmail.com') {
        setIsAdmin(true);
      } else {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
          
          if (!error && data) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
           console.error("Error checking admin status", error);
           setIsAdmin(false);
        }
      }
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const signIn = async () => {
    setIsLoginModalOpen(true);
  };

  const logOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, logOut }}>
      {children}
      {isLoginModalOpen && (
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />
      )}
    </AuthContext.Provider>
  );
}

const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setMsg(error.message);
      } else {
        setMsg('Account created! You can now log in.');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMsg(error.message);
      } else {
        onClose();
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
       <div className="bg-white p-8 max-w-md w-full border border-[#1A1A1A] relative shadow-2xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <h2 className="text-3xl font-serif font-bold mb-2 text-[#1A1A1A]">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-500 mb-6 font-sans text-sm">
            {isSignUp ? 'Sign up with email and password to start posting. (Note: Platform limited to 2 authors)' : 'Enter your email and password to sign in.'}
          </p>
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required className="p-3 border border-gray-300 w-full focus:outline-none focus:border-[#1A1A1A] font-sans transition-colors" />
             <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="p-3 border border-gray-300 w-full focus:outline-none focus:border-[#1A1A1A] font-sans transition-colors" />
             <button type="submit" disabled={loading} className="bg-[#1A1A1A] text-white p-4 uppercase tracking-widest text-xs font-bold hover:bg-black transition-colors disabled:opacity-50 mt-2">
               {loading ? 'Wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
             </button>
          </form>
          {msg && <p className={`mt-4 text-sm font-sans text-center font-medium ${msg.includes('Error') || msg.includes('Invalid') ? 'text-red-500' : 'text-[#1A1A1A]'}`}>{msg}</p>}
          <button onClick={() => { setIsSignUp(!isSignUp); setMsg(''); }} className="w-full text-center mt-6 text-sm underline opacity-60 hover:opacity-100 transition-opacity">
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
       </div>
    </div>
  )
}
