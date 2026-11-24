import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import BlogCard from '../components/BlogCard';

export default function UserProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/social/u/${username}`);
      setProfile(data.user);
      setBlogs(data.blogs);
      setFollowing(data.user.isFollowing);
      setCounts({ followers: data.user.followersCount, following: data.user.followingCount });
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [username]);

  const toggleFollow = async () => {
    const { data } = await api.post(`/social/u/${username}/follow`);
    setFollowing(data.following);
    setCounts((c) => ({ ...c, followers: data.followersCount }));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <p className="text-center py-20 text-gray-500">User not found.</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-semibold shrink-0">
            {(profile.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-gray-700 dark:text-gray-300">{profile.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span><b className="text-gray-900 dark:text-gray-100">{counts.followers}</b> followers</span>
              <span><b className="text-gray-900 dark:text-gray-100">{counts.following}</b> following</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium capitalize">{profile.skillLevel}</span>
              {profile.githubUsername && <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">GitHub</a>}
            </div>
          </div>
          {user && user.id !== profile.id && (
            <button onClick={toggleFollow} className={`px-5 py-2.5 rounded-lg font-medium transition ${following ? 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
              {following ? 'Following' : 'Follow'}
            </button>
          )}
          {user && user.id === profile.id && (
            <Link to="/profile" className="px-5 py-2.5 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">Edit profile</Link>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Posts ({blogs.length})</h2>
        {blogs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No posts yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {blogs.map((b) => <BlogCard key={b._id} blog={b} />)}
          </div>
        )}
      </div>
    </div>
  );
}