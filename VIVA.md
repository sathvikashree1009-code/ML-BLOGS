# Viva / Interview Preparation Notes — ML Blogs

## Elevator Pitch
"ML Blogs is a full-stack, ML-powered blogging platform for developers. It's built as microservices: a Node.js/Express backend for auth, blogs, GitHub integration, and APIs; a Python FastAPI service for ML features (toxic detection, recommendations, semantic search, vulnerable code detection, chatbot); and a React frontend. It has 11 feature phases covering everything from JWT auth to PWA and i18n."

## Architecture Questions
**Q: Why microservices?**
A: Separation of concerns and tech fit. Node.js excels at I/O-heavy web APIs (auth, CRUD, GitHub). Python has the ML ecosystem (transformers, sentence-transformers, sklearn). Splitting lets each service use the best tool, scale independently, and keeps the ML heavy deps out of the Node process. The ML service can be restarted/updated without touching the main backend.

**Q: How do the services communicate?**
A: REST over HTTP. Node calls FastAPI endpoints (/toxic-check, /recommend, /semantic-search, /vuln-scan, /chat) via axios with timeouts and graceful fallbacks if the ML service is down (fail-open for toxic, fallback sort for recommendations).

**Q: Database?**
A: MongoDB (Mongoose ODM). Collections: users, blogs, comments, subscribers. Indexed text search on blog title/content/tags.

## Feature Explanations

**Recommendation engine:**
- Content-based: tag overlap between user's likedTags + readHistory tags and candidate blog tags.
- Popularity boost: views + 2*likes.
- Cold start: if no user tags, rank by popularity.
- Future: collaborative filtering using user-item matrix.

**Toxic content detection:**
- Heuristic: wordlist of toxic terms, scoring by count (0.25 each, capped at 1.0), ALL-CAPS ratio (>40%), excessive punctuation. Threshold 0.5 blocks publishing.
- Optional upgrade: unitary/toxic-bert transformer for ~90% accuracy.

**Semantic search vs keyword search:**
- Keyword: MongoDB $text index, exact token matching.
- Semantic: encode query + docs with sentence-transformers (all-MiniLM-L6-v2), cosine similarity. Captures meaning ("how to fetch data" matches "API calls"). Falls back to TF-IDF then Mongo text if model unavailable.

**Vulnerable code detection:**
- Regex rules per vulnerability class (SQLi concat/f-string, XSS innerHTML, command injection, hardcoded secrets, weak crypto MD5/SHA1, insecure random, path traversal, insecure deserialization, SSRF).
- Each finding: type, severity (high/medium/low), line number, snippet, recommendation.
- Risk score = sum of severity weights.
- Runs on code blocks extracted from Markdown.

**Skill profiling:**
- Metrics: blog count, avg word count, code block count, tag diversity, read count.
- Rules: beginner (<3 posts or <200 avg words), intermediate (≥3 posts & ≥200 words), advanced (≥8 posts & ≥500 words & ≥5 code blocks).

**GitHub integration:**
- Parse repo URL → owner/repo, fetch via GitHub REST API (public, optional token for higher rate limit). Store stars, language, description, forks, updated date. Display on blog.

**Auth:**
- JWT (7d expiry), bcrypt password hashing, roles (user/admin/banned), protected routes via middleware.

**PWA:**
- manifest.json + service worker: cache-first for assets, network-first for API, offline fallback.

## Likely Viva Questions

**Q: How does recommendation differ from search?**
A: Search is query-driven (user types intent). Recommendations are profile-driven (based on accumulated behavior/tags), no query needed.

**Q: How do you handle ML service downtime?**
A: Timeouts + try/catch fallbacks: toxic check fails open (allow publish), recommendations fall back to popularity sort, semantic search falls back to Mongo text search. The platform stays usable.

**Q: Scalability?**
A: Stateless services → horizontal scaling behind a load balancer. MongoDB Atlas for DB. ML service can be replicated; embeddings can be cached/precomputed. Add Redis for session/cache.

**Q: Security?**
A: JWT auth, bcrypt, role-based access, banned accounts, helmet, CORS, input validation, file upload type/size limits, code execution timeout (5s) for playground.

**Q: What's your biggest challenge?**
A: Balancing ML accuracy vs. resource constraints — hence heuristic-first with optional transformer upgrades, and graceful fallbacks.

**Q: Future work?**
A: Collaborative filtering, real LLM (Groq/OpenAI), OAuth GitHub, email digests with SMTP, collaborative editing, code playground with more languages.

## Tech Stack Summary
- Frontend: React 18, Vite, TailwindCSS, React Router, React Markdown, Syntax Highlighter
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs, Multer, Nodemailer, Axios
- ML: Python, FastAPI, Uvicorn, (optional) sentence-transformers, transformers
- DB: MongoDB (Atlas)
- Tooling: Nodemon, Concurrently