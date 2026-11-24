import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('theme') !== 'light' : true));

  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [dark]);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <span className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center text-white text-sm">M</span>
          <span>ML Blogs</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-3 text-sm">
          <Link to="/" className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">{t('home')}</Link>
          <Link to="/playground" className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">Playground</Link>
          <button onClick={() => setDark((d) => !d)} className="px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Toggle theme">
            {dark ? '☀️' : '🌙'}
          </button>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-transparent text-sm border border-gray-200 dark:border-gray-800 rounded-md px-1.5 py-1">
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="hi">HI</option>
          </select>
          {user ? (
            <>
              <Link to="/create" className="px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition font-medium">{t('write')}</Link>
              <Link to="/saved" className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">{t('saved')}</Link>
              <Link to="/analytics" className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">{t('analytics')}</Link>
              {user?.role === 'admin' && <Link to="/admin" className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">Admin</Link>}
              <Link to="/profile" className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">{user.name}</Link>
              <button onClick={() => { logout(); navigate('/'); }} className="px-3 py-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:text-red-500 transition">{t('logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition">Login</Link>
              <Link to="/register" className="px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition font-medium">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}