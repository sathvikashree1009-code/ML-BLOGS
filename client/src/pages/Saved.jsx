import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import BlogCard from '../components/BlogCard';

export default function Saved() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/bookmarks').then((r) => setBlogs(r.data.blogs || [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <p className="text-center py-20 text-gray-500">Please login.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Saved posts</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : blogs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No saved posts yet. Bookmark posts to read later.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogs.map((b) => <BlogCard key={b._id} blog={b} />)}
        </div>
      )}
    </div>
  );
}