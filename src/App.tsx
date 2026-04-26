/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCreatePost from './pages/admin/CreatePost';
import AdminEditPost from './pages/admin/EditPost';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] flex flex-col font-serif">
          <Navbar />
          <main className="flex-grow flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/create" element={<AdminCreatePost />} />
              <Route path="/admin/edit/:id" element={<AdminEditPost />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
