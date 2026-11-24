import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const [s, f] = await Promise.all([
        api.get('/analytics/admin/stats'),
        api.get('/analytics/admin/flagged'),
      ]);
      setStats(s.data);
      setFlagged(f.data.blogs);
    } catch (e) {
      setErr(e.response?.data?.message || 'Admin access required');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const banUser = async (id, ban) => {
    await api.post(`/analytics/admin/users/${id}/ban`, { ban });
    load();
  };

  const deleteBlog = async (id) => {
    if (!confirm('Delete this blog?')) return;
    await api.delete(`/analytics/admin/blogs/${id}`);
    load();
  };

  if (!user) return <p className="text-center py-20 text-gray-500">Please login.</p>;
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (err) return <div className="text-center py-20 text-red-500">{err}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Admin panel</h1>

      {stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Users', value: stats.users },
            { label: 'Blogs', value: stats.blogs },
            { label: 'Flagged', value: stats.flagged },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
              <div className="text-3xl font-bold mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Flagged content</h2>
        {flagged.length === 0 ? (
          <p className="text-sm text-gray-500">No flagged content.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {flagged.map((b) => (
              <li key={b._id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <a href={`/blog/${b._id}`} className="font-medium hover:text-blue-600 dark:hover:text-blue-400">{b.title}</a>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      by {b.author?.name} ({b.author?.email}) · toxic: {b.toxicScore} · vuln: {b.vulnReport?.count || 0}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => banUser(b.author?._id, true)} className="px-3 py-1.5 rounded-lg text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition">Ban author</button>
                    <button onClick={() => deleteBlog(b._id)} className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}