import React from 'react';
import { Link } from 'react-router-dom';
import { readingTime } from '../utils';

export default function BlogCard({ blog }) {
  return (
    <article className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
        {blog.author?.username ? (
          <Link to={`/u/${blog.author.username}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">{blog.author?.name || 'Unknown'}</Link>
        ) : (
          <span className="font-medium text-gray-700 dark:text-gray-300">{blog.author?.name || 'Unknown'}</span>
        )}
        <span>·</span>
        <span>{new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>
      <Link to={`/blog/${blog._id}`}>
        <h2 className="text-lg font-semibold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{blog.title}</h2>
      </Link>
      <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm line-clamp-3 leading-relaxed">{blog.excerpt}</p>
      {blog.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {blog.tags.slice(0, 4).map((t) => (
            <span key={t} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-blue-600 dark:text-blue-400">#{t}</span>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-500 flex gap-4 flex-wrap">
        <span>{readingTime(blog.content)}</span>
        <span>👁 {blog.views}</span>
        <span>❤ {blog.likes?.length || 0}</span>
        {blog.vulnReport?.count > 0 && <span className="text-red-500">🛡 {blog.vulnReport.count}</span>}
      </div>
    </article>
  );
}