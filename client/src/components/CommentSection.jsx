import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function CommentSection({ blogId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await api.get(`/comments/blog/${blogId}`);
    setComments(data.comments);
  };

  useEffect(() => { load(); }, [blogId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post(`/comments/blog/${blogId}`, { content: text, parent: replyTo });
      setText('');
      setReplyTo(null);
      await load();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/comments/${id}`);
    await load();
  };

  const topLevel = comments.filter((c) => !c.parent);
  const repliesOf = (id) => comments.filter((c) => c.parent === id || c.parent?._id === id);

  const renderComment = (c, nested = false) => (
    <div key={c._id} className={`${nested ? 'ml-6 mt-2' : 'mt-4'} bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-800`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-700 dark:text-gray-300">{c.author?.name || 'Unknown'}</span>
          <span className="text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
        </div>
        {user && (user.id === c.author?._id || user.id === c.author) && (
          <button onClick={() => remove(c._id)} className="text-xs text-red-500 hover:underline">Delete</button>
        )}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.content}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        <button onClick={() => setReplyTo(c._id)} className="hover:text-blue-500">Reply</button>
      </div>
      {repliesOf(c._id).map((r) => renderComment(r, true))}
    </div>
  );

  return (
    <section className="mt-10">
      <h3 className="text-xl font-semibold mb-4">Comments ({comments.length})</h3>
      {user ? (
        <form onSubmit={submit} className="mb-6">
          {replyTo && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              Replying to a comment
              <button type="button" onClick={() => setReplyTo(null)} className="text-blue-500">cancel</button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Write a comment..."
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
          <button disabled={loading} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition">
            {loading ? 'Posting...' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Please login to comment.</p>
      )}
      <div>
        {topLevel.map((c) => renderComment(c))}
        {comments.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first!</p>}
      </div>
    </section>
  );
}