import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/analytics/me').then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <p className="text-center py-20 text-gray-500">Please login.</p>;
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <p className="text-center py-20 text-gray-500">No data.</p>;

  const maxViews = Math.max(1, ...data.daily.map((d) => d.views));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>

      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: 'Posts', value: data.totals.posts },
          { label: 'Total views', value: data.totals.views },
          { label: 'Total likes', value: data.totals.likes },
          { label: 'Comments', value: data.totals.comments },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
            <div className="text-3xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Views over last 14 days</h2>
        <div className="flex items-end gap-1 h-40">
          {data.daily.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${(d.views / maxViews) * 100}%`, minHeight: d.views ? 4 : 0 }} title={`${d.date}: ${d.views}`} />
              <span className="text-[9px] text-gray-400 rotate-[-45deg] origin-top-left whitespace-nowrap">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Top posts</h2>
        {data.topPosts.length === 0 ? (
          <p className="text-sm text-gray-500">No posts yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.topPosts.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <a href={`/blog/${p.id}`} className="font-medium hover:text-blue-600 dark:hover:text-blue-400">{p.title}</a>
                <span className="text-sm text-gray-500 dark:text-gray-400">{p.views} views · {p.likes} likes</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}