import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setErr('Missing token.'); setLoading(false); return; }
    api.post('/auth/verify-email', { token })
      .then((r) => setMsg(r.data.message))
      .catch((e) => setErr(e.response?.data?.message || 'Verification failed'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Email verification</h1>
        {loading && <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />}
        {msg && <p className="text-blue-600 dark:text-blue-400">{msg}</p>}
        {err && <p className="text-red-600 dark:text-red-400">{err}</p>}
        <Link to="/login" className="inline-block mt-6 text-blue-600 dark:text-blue-400 font-medium hover:underline">Go to login</Link>
      </div>
    </div>
  );
}