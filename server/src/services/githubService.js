const axios = require('axios');

function parseRepo(url) {
  // supports https://github.com/owner/repo and owner/repo
  let m = url.trim().match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!m) {
    const parts = url.trim().replace(/^https?:\/\//, '').split('/');
    if (parts.length >= 2) m = [null, parts[0], parts[1]];
  }
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

async function fetchRepoDetails(url) {
  const parsed = parseRepo(url);
  if (!parsed) throw new Error('Invalid GitHub repository URL');
  const { owner, repo } = parsed;
  const headers = {};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  return {
    url: data.html_url,
    name: data.full_name,
    stars: data.stargazers_count,
    language: data.language || '',
    description: data.description || '',
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    updatedAt: data.updated_at,
    defaultBranch: data.default_branch,
  };
}

module.exports = { parseRepo, fetchRepoDetails };