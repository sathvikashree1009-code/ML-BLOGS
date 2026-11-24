const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function toxicCheck(text) {
  try {
    const { data } = await axios.post(`${ML_URL}/toxic-check`, { text }, { timeout: 5000 });
    return data;
  } catch (err) {
    // fail open if ML service down
    return { toxic: false, score: 0, reason: 'ml-service unavailable', flagged: [] };
  }
}

async function vulnScan({ code, markdown }) {
  try {
    const { data } = await axios.post(`${ML_URL}/vuln-scan`, { code, markdown }, { timeout: 10000 });
    return data;
  } catch (err) {
    return { vulnerable: false, count: 0, riskScore: 0, findings: [], blocksScanned: 0, engine: 'unavailable' };
  }
}

async function recommend({ likedTags, readTags, candidates }) {
  try {
    const { data } = await axios.post(`${ML_URL}/recommend`, { likedTags, readTags, candidates }, { timeout: 8000 });
    return data.blogIds || [];
  } catch (err) {
    // fallback: sort by views
    return (candidates || [])
      .slice()
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .map((c) => c.id);
  }
}

module.exports = { toxicCheck, recommend, vulnScan };