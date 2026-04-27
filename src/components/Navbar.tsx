import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, isAdmin, signIn, logOut } = useAuth();

  return (
    <nav className="h-20 border-b border-[#1A1A1A] flex items-center justify-between px-6 sm:px-10 shrink-0 bg-[#F9F8F6]">
      <div className="flex items-baseline space-x-4">
        <Link to="/" className="text-2xl font-bold tracking-tight uppercase font-serif text-[#1A1A1A]">
          iLiyaIsaac
        </Link>
        <span className="hidden sm:inline text-xs font-sans uppercase tracking-widest text-[#1A1A1A] border-l border-gray-300 pl-4 opacity-50">
          Editorial
        </span>
      </div>
      <div className="flex items-center space-x-6 font-sans text-xs uppercase tracking-widest text-[#1A1A1A]">
        {isAdmin && (
          <Link
            to="/admin"
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            Admin
          </Link>
        )}
        
        {user ? (
          <button
            onClick={logOut}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            Sign out
          </button>
        ) : (
          <button
            onClick={signIn}
            className="font-bold border border-[#1A1A1A] px-4 py-2 hover:bg-[#1A1A1A] hover:text-white transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
