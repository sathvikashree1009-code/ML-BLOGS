import React, { useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg(data.message);
      if (data.token) setToken(data.token);
    } catch {
      setMsg('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Forgot password</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your email to receive a reset link.</p>
        {msg && <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-sm">{msg}</div>}
        {token && <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs break-all">Dev token: {token}<br />Reset URL: /reset-password?token={token}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition" />
          <button disabled={loading} className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p className="mt-5 text-sm text-gray-500 dark:text-gray-400 text-center"><Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Back to login</Link></p>
      </div>
    </div>
  );
}