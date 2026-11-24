# Append vuln-scan to existing main.py by rewriting full file
import re

# Re-read existing content to append? We'll just rewrite fully with all features.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import math

app = FastAPI(title="ML Blogs ML Service", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Optional heavy imports ----------
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    _st_model = None
    def get_st_model():
        global _st_model
        if _st_model is None:
            _st_model = SentenceTransformer("all-MiniLM-L6-v2")
        return _st_model
    HAS_ST = True
except Exception:
    HAS_ST = False
    np = None

# ---------- Toxic wordlist (heuristic) ----------
TOXIC_TERMS = {
    "stupid", "idiot", "dumb", "hate", "kill", "die", "trash", "garbage",
    "loser", "moron", "scum", "worthless", "shut up", "fuck", "shit",
    "asshole", "bitch", "bastard", "damn", "crap", "suck",
}

def toxic_score(text: str) -> Dict[str, Any]:
    if not text:
        return {"toxic": False, "score": 0.0, "reason": "empty", "flagged": []}
    lower = text.lower()
    flagged = [t for t in TOXIC_TERMS if t in lower]
    score = min(1.0, len(flagged) * 0.25)
    words = text.split()
    caps = sum(1 for w in words if len(w) > 3 and w.isupper())
    if words and caps / len(words) > 0.4:
        score = min(1.0, score + 0.2)
    if text.count("!") > 5 or text.count("?") > 5:
        score = min(1.0, score + 0.1)
    toxic = score >= 0.5
    reason = "flagged terms: " + ", ".join(flagged) if flagged else ("shouting/punctuation" if toxic else "clean")
    return {"toxic": toxic, "score": round(score, 3), "reason": reason, "flagged": flagged}

# ---------- Recommendation ----------
class RecommendRequest(BaseModel):
    likedTags: List[str] = []
    readTags: List[str] = []
    candidates: List[Dict[str, Any]] = []

# ---------- Semantic search helpers ----------
def tokenize(s: str):
    return re.findall(r"[a-z0-9]+", (s or "").lower())

def tfidf_vectors(texts):
    docs = [tokenize(t) for t in texts]
    n = len(docs)
    df = {}
    for d in docs:
        for t in set(d):
            df[t] = df.get(t, 0) + 1
    idf = {t: math.log((n + 1) / (df[t] + 1)) + 1 for t in df}
    vecs = []
    for d in docs:
        tf = {}
        for t in d:
            tf[t] = tf.get(t, 0) + 1
        v = {t: (tf[t] / len(d) if d else 0) * idf.get(t, 0) for t in tf}
        vecs.append(v)
    return vecs

def cosine(a, b):
    if not a or not b:
        return 0.0
    common = set(a) & set(b)
    dot = sum(a[t] * b[t] for t in common)
    na = math.sqrt(sum(x * x for x in a.values()))
    nb = math.sqrt(sum(x * x for x in b.values()))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)

def semantic_search_tfidf(query, docs):
    texts = [f"{d.get('title','')} {d.get('content','')} {' '.join(d.get('tags',[]) or [])}" for d in docs]
    vecs = tfidf_vectors([query] + texts)
    qv = vecs[0]
    dv = vecs[1:]
    scored = [(cosine(qv, dv[i]), docs[i].get("id")) for i in range(len(docs))]
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored

def semantic_search_st(query, docs):
    model = get_st_model()
    texts = [f"{d.get('title','')} {d.get('content','')[:500]} {' '.join(d.get('tags',[]) or [])}" for d in docs]
    embs = model.encode([query] + texts, convert_to_numpy=True, normalize_embeddings=True)
    q = embs[0]
    scored = []
    for i, d in enumerate(docs):
        sim = float((q * embs[i + 1]).sum())
        scored.append((sim, d.get("id")))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored

# ---------- Vulnerability scanner ----------
VULN_RULES = [
    # (id, type, severity, regex, recommendation)
    ("sqli-concat", "SQL Injection", "high",
     r"(execute|query|cursor\.execute|db\.query)\s*\(\s*['\"].*?['\"]\s*\+\s*\w+",
     "Use parameterized queries / prepared statements instead of string concatenation."),
    ("sqli-fstring", "SQL Injection", "high",
     r"(execute|query)\s*\(\s*f['\"].*\{.*\}.*['\"]",
     "Avoid f-strings in SQL; use parameterized queries."),
    ("sqli-template", "SQL Injection", "medium",
     r"(SELECT|INSERT|UPDATE|DELETE).*?\$\{",
     "Do not interpolate variables into SQL; use placeholders."),
    ("xss-innerhtml", "Cross-Site Scripting (XSS)", "high",
     r"innerHTML\s*=\s*[^;]*",
     "Avoid innerHTML with untrusted data; use textContent or sanitize."),
    ("xss-document-write", "Cross-Site Scripting (XSS)", "medium",
     r"document\.write\s*\(",
     "Avoid document.write; use safe DOM APIs."),
    ("xss-eval", "Code Injection", "high",
     r"\beval\s*\(",
     "Avoid eval(); it can execute arbitrary code."),
    ("cmdi-os-system", "Command Injection", "high",
     r"os\.system\s*\(\s*[^)]*\+",
     "Avoid os.system with concatenated input; use subprocess with list args and shell=False."),
    ("cmdi-subprocess-shell", "Command Injection", "medium",
     r"subprocess\.(call|run|Popen)\s*\([^)]*shell\s*=\s*True",
     "Set shell=False and pass arguments as a list."),
    ("cmdi-exec", "Command Injection", "high",
     r"\bexec\s*\(\s*[^)]*\+",
     "Avoid exec() with untrusted input."),
    ("secret-hardcoded", "Hardcoded Secret", "high",
     r"(api[_-]?key|secret|password|token|passwd)\s*=\s*['\"][A-Za-z0-9_\-]{8,}['\"]",
     "Move secrets to environment variables; never commit them."),
    ("weak-crypto-md5", "Weak Cryptography", "medium",
     r"\bmd5\s*\(",
     "MD5 is broken; use SHA-256 or bcrypt for passwords."),
    ("weak-crypto-sha1", "Weak Cryptography", "medium",
     r"\bsha1\s*\(",
     "SHA-1 is deprecated; use SHA-256+."),
    ("insecure-random", "Insecure Randomness", "low",
     r"Math\.random\s*\(\s*\)",
     "Math.random is not cryptographically secure; use crypto.getRandomValues for security-sensitive code."),
    ("path-traversal", "Path Traversal", "high",
     r"open\s*\(\s*[^)]*user|readFile\s*\(\s*req\.",
     "Validate and sanitize file paths; restrict to allowed directories."),
    ("insecure-deser-pickle", "Insecure Deserialization", "high",
     r"pickle\.loads?\s*\(",
     "Avoid pickle on untrusted data; use JSON or safe serializers."),
    ("insecure-deser-yaml", "Insecure Deserialization", "medium",
     r"yaml\.load\s*\([^)]*\)(?!.*Loader)",
     "Use yaml.safe_load instead of yaml.load."),
    ("ssrf", "SSRF", "medium",
     r"requests\.(get|post)\s*\(\s*[^)]*user|fetch\s*\(\s*[^)]*req\.",
     "Validate URLs server-side; restrict to allowed hosts."),
]

def scan_code(code: str) -> Dict[str, Any]:
    findings = []
    lines = code.splitlines()
    for rid, vtype, sev, pattern, rec in VULN_RULES:
        for i, line in enumerate(lines, start=1):
            if re.search(pattern, line, re.IGNORECASE):
                findings.append({
                    "id": rid,
                    "type": vtype,
                    "severity": sev,
                    "line": i,
                    "snippet": line.strip()[:200],
                    "recommendation": rec,
                })
    # dedup identical (id,line)
    seen = set()
    uniq = []
    for f in findings:
        key = (f["id"], f["line"])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(f)
    score = sum({"high": 3, "medium": 2, "low": 1}.get(f["severity"], 1) for f in uniq)
    return {
        "vulnerable": len(uniq) > 0,
        "count": len(uniq),
        "riskScore": score,
        "findings": uniq,
    }

def extract_code_blocks(markdown: str) -> List[str]:
    blocks = re.findall(r"```[a-zA-Z]*\n(.*?)```", markdown or "", re.DOTALL)
    return blocks

# ---------- Endpoints ----------
@app.post("/toxic-check")
def check_toxic(payload: Dict[str, Any]):
    text = payload.get("text", "")
    return toxic_score(text)

@app.post("/recommend")
def recommend(req: RecommendRequest):
    liked = set(t.lower() for t in (req.likedTags or []))
    read = set(t.lower() for t in (req.readTags or []))
    user_tags = liked | read
    ranked = []
    for c in req.candidates:
        tags = set(t.lower() for t in (c.get("tags") or []))
        overlap = len(user_tags & tags)
        popularity = c.get("views", 0) + (len(c.get("likes", []) or []) * 2)
        if not user_tags:
            score = popularity
        else:
            score = overlap * 10 + popularity * 0.01
        ranked.append((score, c.get("id")))
    ranked.sort(key=lambda x: x[0], reverse=True)
    return {"blogIds": [r[1] for r in ranked]}

class SemanticRequest(BaseModel):
    query: str
    blogs: List[Dict[str, Any]] = []

@app.post("/semantic-search")
def semantic_search(req: SemanticRequest):
    if not req.blogs:
        return {"rankedIds": [], "scores": {}, "engine": "none"}
    if HAS_ST:
        try:
            scored = semantic_search_st(req.query, req.blogs)
            engine = "sentence-transformers"
        except Exception:
            scored = semantic_search_tfidf(req.query, req.blogs)
            engine = "tfidf-fallback"
    else:
        scored = semantic_search_tfidf(req.query, req.blogs)
        engine = "tfidf"
    scores = {bid: round(s, 4) for s, bid in scored}
    return {"rankedIds": [s[1] for s in scored], "scores": scores, "engine": engine}

class VulnRequest(BaseModel):
    code: Optional[str] = None
    markdown: Optional[str] = None

@app.post("/vuln-scan")
def vuln_scan(req: VulnRequest):
    code = req.code or ""
    blocks = []
    if req.markdown:
        blocks = extract_code_blocks(req.markdown)
    targets = blocks if blocks else ([code] if code.strip() else [])
    all_findings = []
    for idx, c in enumerate(targets):
        res = scan_code(c)
        for f in res["findings"]:
            f = dict(f)
            f["block"] = idx
            all_findings.append(f)
    risk = sum({"high": 3, "medium": 2, "low": 1}.get(f["severity"], 1) for f in all_findings)
    return {
        "vulnerable": len(all_findings) > 0,
        "count": len(all_findings),
        "riskScore": risk,
        "findings": all_findings,
        "blocksScanned": len(targets),
        "engine": "heuristic-regex",
    }

# ---------- Chatbot ----------
import os
GROQ_KEY = os.getenv("GROQ_API_KEY", "")
HF_TOKEN = os.getenv("HF_TOKEN", "")

def rule_based_reply(message: str, context: str = "") -> str:
    m = (message or "").lower()
    if any(g in m for g in ["hi", "hello", "hey"]):
        return "Hey! 👋 I'm the ML Blogs assistant. I can help you create posts, search blogs, get recommendations, or explain our ML features (toxic detection, semantic search, vulnerable code scan). What would you like to do?"
    if "create" in m and "blog" in m:
        return "To create a blog: click 'Write' in the navbar, add a title, write Markdown (with code blocks using ```), add comma-separated tags, optionally attach a GitHub repo URL, then Publish. I'll scan your content for toxicity and vulnerable code automatically."
    if "search" in m or "find" in m:
        return "Use the search bar on the Home page. Toggle 'Semantic' to search by meaning (embeddings) instead of exact keywords. You can also filter by tags."
    if "recommend" in m:
        return "The '✨ Recommended for you' section on the Home page suggests blogs based on your reading history and liked tags. Read a few blogs to improve recommendations."
    if "toxic" in m:
        return "Toxic content detection uses an NLP heuristic (and optionally a transformer) to score posts before publishing. If a post is flagged toxic, publishing is blocked with the reason and flagged terms."
    if "vuln" in m or "security" in m or "sql" in m:
        return "Vulnerable code detection scans code snippets in your blog for SQL injection, XSS, command injection, hardcoded secrets, weak crypto, and more. Use the '🛡️ Scan code' button in the editor or view the report on the blog page."
    if "skill" in m or "level" in m:
        return "Your skill level (beginner/intermediate/advanced) is computed from your posts: count, average length, code blocks, and tag diversity. View it on your Profile page."
    if "github" in m or "repo" in m:
        return "You can attach a GitHub repository to any blog by pasting its URL in the 'GitHub repo URL' field and clicking Attach. Repo details (stars, language, description) show on the blog page."
    if "theme" in m or "dark" in m or "light" in m:
        return "Use the theme toggle in the navbar to switch between dark and light mode. Your preference is saved."
    return "I'm not sure about that. I can help with: creating blogs, searching, recommendations, toxic detection, security scans, skill levels, GitHub repos, and themes. Try asking about one of those!"

async def llm_reply(message: str) -> str:
    if GROQ_KEY:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=20) as client:
                r = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_KEY}"},
                    json={
                        "model": "llama-3.1-8b-instant",
                        "messages": [
                            {"role": "system", "content": "You are a helpful assistant for ML Blogs, a blogging platform for developers. Answer concisely about blogging, coding, and the platform's features: toxic detection, semantic search, recommendations, vulnerable code scan, GitHub integration, skill profiling."},
                            {"role": "user", "content": message},
                        ],
                        "max_tokens": 300,
                    },
                )
                return r.json()["choices"][0]["message"]["content"]
        except Exception as e:
            pass
    return rule_based_reply(message)

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

@app.post("/chat")
async def chat(req: ChatRequest):
    if GROQ_KEY or HF_TOKEN:
        reply = await llm_reply(req.message)
    else:
        reply = rule_based_reply(req.message)
    return {"reply": reply, "llm": bool(GROQ_KEY)}

@app.get("/health")
def health():
    return {"status": "ok", "service": "ml-service", "features": ["toxic-check", "recommend", "semantic-search", "vuln-scan", "chat"], "has_sentence_transformers": HAS_ST, "has_llm": bool(GROQ_KEY)}