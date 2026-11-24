import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateBlog() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', tags: '', coverImage: '', status: 'published', scheduledFor: '' });
  const [repoUrl, setRepoUrl] = useState('');
  const [repo, setRepo] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [dupResult, setDupResult] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm((f) => ({ ...f, coverImage: `http://localhost:5000${data.url}` }));
    } catch (err) {
      setErr(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const aiAssist = async (task) => {
    setAiLoading(true);
    setAiResult('');
    try {
      const { data } = await api.post('/ai/assist', { content: form.content, task });
      setAiResult(data.result);
      if (task === 'tags' && data.result) {
        setForm((f) => ({ ...f, tags: data.result }));
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'AI assist failed');
    } finally {
      setAiLoading(false);
    }
  };

  const checkDuplicate = async () => {
    try {
      const { data } = await api.post('/ai/check-duplicate', { title: form.title, content: form.content });
      setDupResult(data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Duplicate check failed');
    }
  };

  const resolveRepo = async () => {
    if (!repoUrl.trim()) return;
    setResolving(true);
    try {
      const { data } = await api.get('/github/repo', { params: { url: repoUrl } });
      setRepo(data.repo);
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not resolve repo');
      setRepo(null);
    } finally {
      setResolving(false);
    }
  };

  const scanCode = async () => {
    setScanning(true);
    try {
      const { data } = await api.post('/vuln/scan', { markdown: form.content });
      setScanResult(data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const payload = {
        title: form.title,
        content: form.content,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        coverImage: form.coverImage,
        status: form.status,
        scheduledFor: form.status === 'scheduled' ? new Date(form.scheduledFor).toISOString() : undefined,
        repo: repo || undefined,
      };
      const { data } = await api.post('/blogs', payload);
      navigate(`/blog/${data.blog._id}`);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to create blog');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Write a new post</h1>
      {err && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">{err}</div>}
      <form onSubmit={submit} className="space-y-5">
        <input className={inputCls} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div className="flex gap-2 items-center">
          <input className={`flex-1 ${inputCls}`} placeholder="Cover image URL (optional)" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
          <label className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition cursor-pointer">
            {uploading ? 'Uploading...' : '📁 Upload'}
            <input type="file" accept="image/*" onChange={uploadCover} className="hidden" disabled={uploading} />
          </label>
        </div>
        {form.coverImage && <img src={form.coverImage} alt="cover preview" className="rounded-lg max-h-48 object-cover" />}
        <input className={inputCls} placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <div className="flex gap-2">
          <input className={`flex-1 ${inputCls}`} placeholder="GitHub repo URL (optional)" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
          <button type="button" onClick={resolveRepo} disabled={resolving} className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition disabled:opacity-50">
            {resolving ? '...' : 'Attach'}
          </button>
        </div>
        {repo && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm">
            <div className="font-semibold text-blue-600 dark:text-blue-400">{repo.name}</div>
            <div className="text-gray-600 dark:text-gray-400 mt-0.5">{repo.description}</div>
            <div className="text-xs text-gray-500 mt-1.5">⭐ {repo.stars} · {repo.language} · forks {repo.forks}</div>
          </div>
        )}
        <textarea className={`${inputCls} font-mono text-sm`} rows={18} placeholder="Write your blog in Markdown... Use ``` for code blocks." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI assist:</span>
          {['outline', 'summary', 'tags'].map((t) => (
            <button key={t} type="button" onClick={() => aiAssist(t)} disabled={aiLoading || !form.content} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium transition disabled:opacity-50 capitalize">
              {aiLoading ? '...' : t}
            </button>
          ))}
          <button type="button" onClick={checkDuplicate} disabled={!form.title || !form.content} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium transition disabled:opacity-50">
            Check duplicates
          </button>
        </div>
        {aiResult && (
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-sm whitespace-pre-wrap">{aiResult}</div>
        )}
        {dupResult && (
          <div className={`text-sm p-3 rounded-lg border ${dupResult.duplicate ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300'}`}>
            {dupResult.duplicate ? `Possible duplicate (${dupResult.score}% similar): ${dupResult.similarBlog?.title}` : `No duplicates found (best match ${dupResult.score}%).`}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={scanCode} disabled={scanning} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition disabled:opacity-50">
            {scanning ? 'Scanning...' : '🛡️ Scan code'}
          </button>
          {scanResult && (
            <span className={`text-sm font-medium ${scanResult.vulnerable ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {scanResult.vulnerable ? `${scanResult.count} issue(s) (risk ${scanResult.riskScore})` : 'No vulnerabilities detected'}
            </span>
          )}
          <select className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
          {form.status === 'scheduled' && (
            <input type="datetime-local" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm" value={form.scheduledFor || ''} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} required />
          )}
          <button type="submit" disabled={saving} className="ml-auto bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50">
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
        {scanResult && scanResult.vulnerable && (
          <ul className="text-xs space-y-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
            {scanResult.findings.map((f, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300">
                <span className="text-red-600 dark:text-red-400 font-medium">{f.severity}</span> {f.type} (line {f.line}) — {f.recommendation}
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}