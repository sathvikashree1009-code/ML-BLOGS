import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import BlogCard from '../components/BlogCard';

export default function Profile() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({ name: user?.name || '', bio: '', avatar: '', githubUsername: '' });
  const [saved, setSaved] = useState(false);
  const [skill, setSkill] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', bio: user.bio || '', avatar: user.avatar || '', githubUsername: user.githubUsername || '' });
      api.get('/blogs', { params: { author: user.id } }).then((r) => setBlogs(r.data.blogs)).catch(() => {});
      api.get('/skill/me').then((r) => setSkill(r.data)).catch(() => {});
    }
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    await api.put('/auth/me', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return <p className="text-center py-20 text-gray-500">Please login.</p>;

  const inputCls = "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        {skill && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Skill level</span>
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium capitalize">{skill.skillLevel}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span>Blogs: <b className="text-gray-900 dark:text-gray-100">{skill.metrics.blogCount}</b></span>
              <span>Avg words: <b className="text-gray-900 dark:text-gray-100">{skill.metrics.avgWords}</b></span>
              <span>Code blocks: <b className="text-gray-900 dark:text-gray-100">{skill.metrics.codeBlocks}</b></span>
              <span>Tags: <b className="text-gray-900 dark:text-gray-100">{skill.metrics.tagDiversity}</b></span>
            </div>
          </div>
        )}

        {saved && <p className="text-blue-600 dark:text-blue-400 text-sm mb-3">Saved!</p>}
        <form onSubmit={save} className="space-y-3">
          <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputCls} placeholder="Avatar URL" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} />
          <input className={inputCls} placeholder="GitHub username" value={form.githubUsername} onChange={(e) => setForm({ ...form, githubUsername: e.target.value })} />
          <textarea className={inputCls} rows={3} placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <button className="bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition">Save profile</button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">My posts ({blogs.length})</h2>
        {blogs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">You haven't written any posts yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {blogs.map((b) => <BlogCard key={b._id} blog={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}