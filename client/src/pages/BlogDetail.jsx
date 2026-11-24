import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import { readingTime } from '../utils';

export default function BlogDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [related, setRelated] = useState([]);
  const [copied, setCopied] = useState(false);

  const headings = useMemo(() => {
    if (!blog) return [];
    const lines = (blog.content || '').split('\\n');
    const out = [];
    for (const line of lines) {
      const m = line.match(/^(#{1,3})\\s+(.+)$/);
      if (m) {
        const level = m[1].length;
        const text = m[2].trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        out.push({ level, text, id });
      }
    }
    return out;
  }, [blog]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  useEffect(() => {
    api.get(`/blogs/${id}`).then((r) => {
      setBlog(r.data.blog);
      if (user) setLiked(r.data.blog.likes?.includes(user.id));
    });
    api.get(`/bookmarks/related/${id}`).then((r) => setRelated(r.data.blogs || [])).catch(() => {});
  }, [id, user]);

  useEffect(() => {
    if (user) {
      api.get('/bookmarks').then((r) => {
        const ids = (r.data.blogs || []).map((b) => b._id);
        setBookmarked(ids.includes(id));
      }).catch(() => {});
    }
  }, [user, id]);

  const like = async () => {
    const { data } = await api.post(`/blogs/${id}/like`);
    setLiked(data.liked);
    setBlog((b) => ({ ...b, likes: Array(data.likes).fill(0) }));
  };

  const bookmark = async () => {
    const { data } = await api.post(`/bookmarks/${id}`);
    setBookmarked(data.bookmarked);
  };

  if (!blog) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{blog.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          {blog.author?.username ? (
            <Link to={`/u/${blog.author.username}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">{blog.author?.name}</Link>
          ) : (
            <span className="font-medium text-gray-700 dark:text-gray-300">{blog.author?.name}</span>
          )}
          <span>·</span>
          <span>{new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          {blog.tags?.map((t) => <span key={t} className="text-blue-600 dark:text-blue-400">#{t}</span>)}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Share:</span>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.title)}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition">𝕏</a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition">in</a>
          <button onClick={copyLink} className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition">{copied ? 'Copied!' : '🔗 Copy'}</button>
        </div>
      </header>

      {blog.coverImage && <img src={blog.coverImage} alt="" className="mb-8 rounded-xl w-full max-h-[420px] object-cover" />}

      {headings.length > 2 && (
        <nav className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="text-sm font-semibold mb-2">Table of contents</div>
          <ul className="space-y-1 text-sm">
            {headings.map((h, i) => (
              <li key={i} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                <a href={`#${h.id}`} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition">{h.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1({ children }) {
              const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return <h1 id={id}>{children}</h1>;
            },
            h2({ children }) {
              const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return <h2 id={id}>{children}</h2>;
            },
            h3({ children }) {
              const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              return <h3 id={id}>{children}</h3>;
            },
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-xl !mt-4 !mb-4" {...props}>
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm" {...props}>{children}</code>
              );
            },
          }}
        >
          {blog.content}
        </ReactMarkdown>
      </div>

      {blog.repo?.url && (
        <div className="mt-8 p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <h3 className="font-semibold mb-2 flex items-center gap-2">📦 Attached Repository</h3>
          <a href={blog.repo.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{blog.repo.name || blog.repo.url}</a>
          {blog.repo.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{blog.repo.description}</p>}
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex flex-wrap gap-3">
            {blog.repo.language && <span>🔵 {blog.repo.language}</span>}
            <span>⭐ {blog.repo.stars}</span>
            {blog.repo.forks !== undefined && <span>🍴 {blog.repo.forks}</span>}
            {blog.repo.updatedAt && <span>Updated {new Date(blog.repo.updatedAt).toLocaleDateString()}</span>}
          </div>
        </div>
      )}

      {blog.vulnReport && blog.vulnReport.count > 0 && (
        <div className="mt-8 p-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
          <h3 className="font-semibold mb-3 text-red-700 dark:text-red-300">🛡️ Security Scan: {blog.vulnReport.count} issue(s) (risk {blog.vulnReport.riskScore})</h3>
          <ul className="space-y-2 text-sm">
            {blog.vulnReport.findings.map((f, i) => (
              <li key={i} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-100 dark:border-red-900/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${f.severity === 'high' ? 'bg-red-600 text-white' : f.severity === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}>{f.severity}</span>
                  <span className="font-medium">{f.type}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">line {f.line}</span>
                </div>
                <code className="block text-xs text-gray-600 dark:text-gray-400 mt-1.5 break-all font-mono">{f.snippet}</code>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">💡 {f.recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {blog.vulnReport && blog.vulnReport.count === 0 && (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-sm text-blue-700 dark:text-blue-300">
          🛡️ Security scan: no vulnerabilities detected.
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-3">
        <button onClick={like} className={`px-4 py-2 rounded-lg font-medium transition ${liked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
          ❤ {blog.likes?.length || 0}
        </button>
        {user && (
          <button onClick={bookmark} className={`px-4 py-2 rounded-lg font-medium transition ${bookmarked ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            {bookmarked ? '🔖 Saved' : '🔖 Save'}
          </button>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">👁 {blog.views} views</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{readingTime(blog.content)}</span>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h3 className="text-xl font-semibold mb-4">Related posts</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((b) => (
              <a key={b._id} href={`/blog/${b._id}`} className="block p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500/60 transition">
                <div className="font-medium">{b.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{b.author?.name} · {readingTime(b.content)}</div>
              </a>
            ))}
          </div>
        </section>
      )}

      <CommentSection blogId={id} />
    </article>
  );
}