const { fetchRepoDetails } = require('../services/githubService');

exports.resolveRepo = async (req, res, next) => {
  try {
    const url = req.query.url || req.body.url;
    if (!url) return res.status(400).json({ message: 'url is required' });
    const details = await fetchRepoDetails(url);
    res.json({ repo: details });
  } catch (err) {
    const status = err.response?.status || 400;
    res.status(status).json({ message: err.response?.data?.message || err.message });
  }
};