import React, { useEffect, useState } from 'react';
import api from '../api';
import BlogCard from '../components/BlogCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [tags, setTags] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [semantic, setSemantic] = useState(false);
  const [activeTag, setActiveTag] = useState('');
  const [view, setView] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minRead, setMinRead] = useState('');

  const load = async (q = search) => {
    if (view === 'following') {
      const { data } = await api.get('/social/feed', { params: { page, limit: 9 } });
      setBlogs(data.blogs);
      setPages(data.pages || 1);
      return;
    }
    if (semantic && q.trim()) {
      const { data } = await api.get('/search/semantic', { params: { q } });
      setBlogs(data.blogs);
      setPages(1);
      return;
    }
    const params = { page, limit: 9 };
    if (q) params.search = q;
    if (activeTag) params.tag = activeTag;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (minRead) params.minRead = minRead;
    const { data } = await api.get('/blogs', { params });
    setBlogs(data.blogs);
    setPages(data.pages);
  };

  useEffect(() => { load(); }, [page, activeTag, semantic, view, dateFrom, dateTo, minRead]);
  useEffect(() => { api.get('/blogs/tags').then((r) => setTags(r.data.tags)).catch(() => {}); }, []);
  useEffect(() => {
    if (user) api.get('/recommendations').then((r) => setRecommended(r.data.blogs || [])).catch(() => setRecommended([]));
    else setRecommended([]);
  }, [user]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); load(search); };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-6 sm:py-10">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
          A blogging platform for <span className="text-blue-500">developers</span>
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          ML Blogs is a machine-learning based blogging platform for developers and hackers. Write in Markdown, attach GitHub repos, and get ML-powered recommendations, semantic search, toxic-content filtering, and security scans.
        </p>
      </section>

      {/* Feature highlights */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: '🧠', title: 'ML Recommendations', desc: 'Personalized posts from your reading behavior and tags.' },
          { icon: '🔍', title: 'Semantic Search', desc: 'Search by meaning, not just keywords.' },
          { icon: '🛡️', title: 'Security Scan', desc: 'Detects SQLi, XSS, secrets, weak crypto in code.' },
          { icon: '🚫', title: 'Toxic Filter', desc: 'NLP-based content moderation before publishing.' },
          { icon: '📦', title: 'GitHub Integration', desc: 'Attach repos with stars, language, details.' },
          { icon: '📊', title: 'Skill Profiling', desc: 'Beginner / Intermediate / Advanced levels.' },
          { icon: '💬', title: 'AI Chatbot', desc: 'Dev assistant for questions and blog tips.' },
          { icon: '🌐', title: 'PWA + i18n', desc: 'Installable, offline-capable, multi-language.' },
        ].map((f) => (
          <div key={f.title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-blue-500/50 transition">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="font-semibold text-sm">{f.title}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{f.desc}</div>
          </div>
        ))}
      </section>

      {user && (
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
          {['all', 'following'].map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition ${view === v ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {v === 'all' ? 'All posts' : 'Following'}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="flex-1 relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blogs by meaning or keywords..."
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 px-2 cursor-pointer select-none">
          <input type="checkbox" checked={semantic} onChange={(e) => setSemantic(e.target.checked)} className="accent-blue-500" />
          Semantic
        </label>
        <button className="bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition">Search</button>
      </form>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowFilters((s) => !s)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
          {showFilters ? 'Hide filters' : '⚙️ Filters'}
        </button>
      </div>
      {showFilters && (
        <div className="flex flex-wrap gap-3 items-end bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Min read (min)</label>
            <input type="number" min="1" value={minRead} onChange={(e) => { setMinRead(e.target.value); setPage(1); }} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded px-3 py-1.5 text-sm w-24" />
          </div>
          <button onClick={() => { setDateFrom(''); setDateTo(''); setMinRead(''); }} className="text-sm text-red-500 hover:underline">Clear</button>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveTag(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${activeTag === '' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t.name}
              onClick={() => { setActiveTag(t.name); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${activeTag === t.name ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              #{t.name} <span className="opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recommended */}
      {user && recommended.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">✨ Recommended for you</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.slice(0, 6).map((b) => <BlogCard key={b._id} blog={b} />)}
          </div>
        </section>
      )}

      {/* Blogs */}
      <section>
        <h2 className="text-xl font-semibold mb-4">{activeTag ? `#${activeTag}` : 'Latest posts'}</h2>
        {blogs.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-lg">No posts yet.</p>
            <p className="text-sm mt-1">Be the first to write one.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((b) => <BlogCard key={b._id} blog={b} />)}
          </div>
        )}
      </section>

      {pages > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition ${p === page ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}