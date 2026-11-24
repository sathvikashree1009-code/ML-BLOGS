# ML Blogs — Machine Learning Based Blogging Platform for Developers & Hackers

A full-stack blogging platform for developers, combining a modern blog engine with ML-powered features: recommendations, toxic content detection, semantic search, user skill profiling, vulnerable code detection, an AI chatbot, and more. Built as a microservices architecture (Node.js + Python FastAPI + React).

## ✨ Features

### Core
- JWT authentication (register/login/profile, roles, banned accounts)
- Blog CRUD with Markdown + syntax-highlighted code snippets
- Tags system with filtering and pagination
- GitHub repository integration (attach repos to posts, show stars/language/description)
- Comments with replies, likes
- Bookmarks / saved posts
- Follow authors + personalized feed
- Public author profiles

### ML / Intelligence
- Toxic content detection (heuristic NLP, blocks toxic posts)
- Recommendation engine (tag overlap + popularity, cold-start by popularity)
- Semantic search (TF-IDF → sentence-transformers embeddings when installed)
- User skill profiling (beginner/intermediate/advanced from posting behavior)
- Vulnerable code detection (SQLi, XSS, command injection, hardcoded secrets, weak crypto, path traversal, insecure deserialization, SSRF)
- AI chatbot (rule-based + optional Groq LLM)
- AI writing assistant (outline/summary/tags)
- Plagiarism / duplicate detection (Jaccard similarity)

### Content tools
- Image upload (cover images)
- Drafts & scheduled publishing (auto-publish when due)
- Share buttons (X, LinkedIn, copy link)
- Table of contents (auto-generated from headings)
- Search filters (date range, min reading time)
- Reading time estimate
- Related posts

### Analytics & admin
- Per-author analytics dashboard (views, likes, top posts, 14-day chart)
- Admin moderation panel (flagged content, ban users, delete posts)
- RSS feed (`/feed.xml`)
- Email digest (subscribe + send, SMTP optional)

### Polish
- Dark / light theme toggle
- Multi-language (EN/ES/HI)
- Code playground (run JS in-browser, Python via backend)
- PWA (installable, offline-capable)
- Responsive UI

## 🏗️ Architecture

```
ml-blogs/
├── client/        # React + Vite + Tailwind (frontend)
├── server/        # Node.js + Express + Mongoose (main backend)
└── ml-service/    # Python FastAPI (ML microservice)
```

- **Node.js (main backend):** auth, blogs, GitHub, comments, bookmarks, social, analytics, admin, upload, RSS, digest, AI, code runner, APIs
- **Python FastAPI (ML service):** toxic detection, recommendations, semantic search, vulnerable code scan, chatbot
- **MongoDB:** data store (Atlas or local)
- **React (Vite):** frontend UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas URI)

### 1. Install dependencies
```bash
npm run install:all          # root + client + server
cd ml-service && pip install -r requirements.txt
```

### 2. Configure environment
```bash
cd server
cp .env.example .env         # set MONGO_URI, JWT_SECRET, (optional) GROQ_API_KEY
```

### 3. Run
```bash
# Terminal 1 (root) — backend + frontend
npm run dev

# Terminal 2 — ML service
cd ml-service && uvicorn main:app --reload --port 8000
```

Open http://localhost:5173

### Optional upgrades
- True semantic search: `pip install sentence-transformers` in ml-service, restart
- Real LLM chatbot/assistant: set `GROQ_API_KEY` in server/.env
- Email digests: set SMTP_* in server/.env
- Admin role: `node promote.js <email>`

## 📁 Project Structure

```
client/src/
  components/   Navbar, BlogCard, Chatbot, CommentSection
  pages/        Home, Login, Register, CreateBlog, BlogDetail, Profile, Saved,
                UserProfile, Analytics, Admin, Playground
  context/      AuthContext, LanguageContext
  utils.js

server/src/
  controllers/  auth, blog, github, recommendation, search, skill, vuln, chat,
                comment, bookmark, social, analytics, rss, digest, ai, run, upload
  models/       User, Blog, Comment, Subscriber
  routes/
  services/     mlService, githubService
  middleware/   auth, errorHandler

ml-service/
  main.py       FastAPI: toxic-check, recommend, semantic-search, vuln-scan, chat
```

## 📜 License
MIT