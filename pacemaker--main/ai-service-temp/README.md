# 🧠 Groq Medical AI Service

A **production-ready FastAPI microservice** powered by **Groq AI (LLaMA 3.1-70B)** for medical education. Built for speed, resilience, and extensibility.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.1_70B-F55036)](https://groq.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5-orange)](https://www.trychroma.com)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)](./Dockerfile)

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Caching](#caching)
- [RAG System](#rag-system)
- [Document Ingestion](#document-ingestion)
- [Testing](#testing)
- [Docker](#docker)
- [Performance](#performance)

---

## ✨ Features

| Endpoint | Category | Description |
|---|---|---|
| `POST /tutor/explain` | 🎓 Tutor | AI-structured explanation for any medical topic |
| `POST /tutor/ask` | 🎓 Tutor | ChromaDB RAG-powered Q&A with batch embedding |
| `POST /generate-mcq` | 📝 Assessment | MCQs with viable distractors & clinical rationale |
| `POST /simulate-patient` | 🏥 Simulation | Multi-turn clinical patient encounter |
| `POST /ingest/text` | 📚 Ingestion | Ingest raw text into ChromaDB vector store |
| `POST /ingest/file` | 📚 Ingestion | Upload `.txt` files into ChromaDB |
| `GET /ingest/stats` | 📚 Ingestion | ChromaDB vector store statistics |
| `GET /health` | ⚙️ System | Live health probe: Groq API, Redis, ChromaDB |
| `GET /cache/stats` | ⚙️ System | Redis cache hit/miss counters |
| `GET /rank/predict` | 📊 Rank | Hybrid AI + rule-based rank prediction |

**Key capabilities:**
- 🔁 **Resilient**: Exponential backoff retries + static fallback responses when Groq is down
- ⚡ **Fast**: Redis caching + ChromaDB batch embedding + Redis embedding cache
- 📚 **Extensible**: Upload any medical document → immediately searchable via RAG
- 🐳 **Containerized**: Single `docker compose up` deployment with health checks
- 🧪 **Tested**: Prompt QA scoring + Locust load testing (p95 < 2s)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                      │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  │
│  │  /tutor  │  │  /mcq    │  │ /simulate │  │ /ingest  │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └────┬─────┘  │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  ┌────────────────────────────────────────────────────┐     │
│  │            Redis Cache (SHA-256 keys, 15min TTL)   │     │
│  └────────────────────────────────────────────────────┘     │
│       │              │              │                         │
│       ▼              ▼              ▼                         │
│  ┌─────────────────────────────────────────────────┐        │
│  │       OptimizedRAGRetriever (Day 12)            │        │
│  │  Embedding Cache (Redis) → ChromaDB → Fallback  │        │
│  └─────────────────────────────────────────────────┘        │
│                       │                                       │
│                       ▼                                       │
│  ┌─────────────────────────────────────────────────┐        │
│  │     GroqClient (LLaMA 3.1-70B via Groq API)     │        │
│  │     Exponential backoff · Static fallbacks       │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
│  ┌──────────────────────────────────────┐                   │
│  │  ChromaDB (persistent vector store)  │                   │
│  │  Seeded from knowledge base + uploads│                   │
│  └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

**Request flow:**
```
Request → CORS Middleware → Request Timer
        → Redis Cache? ──→ HIT: return cached
        ↓ MISS
        → RAG Retrieve (ChromaDB + embedding cache)
        → Groq LLM Call (with retry + fallback)
        → Cache response (SHA-256, 15min TTL)
        → Return + X-Cache headers + X-Process-Time-Ms
```

---

## 🚀 Quick Start

### Option A — Local (without Docker)

```bash
# 1. Clone and setup
git clone <repo-url>
cd groq-ai-service

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/macOS

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
copy .env.example .env
# Edit .env — set your GROQ_API_KEY

# 5. Start Redis (optional — service degrades gracefully)
docker run -d -p 6379:6379 redis:7.2-alpine

# 6. Run the server
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** for interactive Swagger UI.

### Option B — Docker Compose (recommended)

```bash
# Start everything (FastAPI + Redis + ChromaDB)
docker compose up --build

# Run in background
docker compose up -d --build

# Stop
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## 📖 API Reference

> Full OpenAPI spec available at `/docs` (Swagger) and `/redoc`.

### `POST /tutor/explain`

Generates a structured AI explanation for any medical topic.

**Request:**
```json
{
  "topic": "Myocardial Infarction",
  "level": "intermediate",
  "context": "Focus on STEMI management"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `topic` | string | ✅ | Medical topic (2–500 chars) |
| `level` | enum | ❌ | `beginner` / `intermediate` / `advanced` (default: `intermediate`) |
| `context` | string | ❌ | Additional context or focus area |

**Response:**
```json
{
  "topic": "Myocardial Infarction",
  "level": "intermediate",
  "explanation": "...",
  "is_fallback": false,
  "cache_hit": false
}
```

**PDF Download:** Add `?download=pdf` to get a formatted PDF report.

---

### `POST /tutor/ask`

RAG-augmented Q&A grounded in the medical knowledge base (ChromaDB).

**Request:**
```json
{
  "question": "What is the first-line treatment for STEMI?",
  "level": "advanced",
  "top_k": 3
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `question` | string | ✅ | Medical question (5–1000 chars) |
| `level` | enum | ❌ | Student level (default: `intermediate`) |
| `top_k` | int | ❌ | Number of RAG chunks to retrieve (1–5, default: 3) |

**Response:**
```json
{
  "question": "What is the first-line treatment for STEMI?",
  "answer": "...",
  "sources": [
    {"id": "kb_abc123", "topic": "cardiology", "score": 0.923, "source": "knowledge_base_seed"}
  ],
  "is_fallback": false,
  "cache_hit": false
}
```

---

### `POST /generate-mcq`

Generates MCQs with viable, plausible distractors and clinical rationale.

**Request:**
```json
{
  "topic": "Heart Failure Management",
  "num_questions": 5,
  "difficulty": "hard"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `topic` | string | ✅ | Medical topic |
| `num_questions` | int | ❌ | 1–10 questions (default: 5) |
| `difficulty` | enum | ❌ | `easy` / `medium` / `hard` (default: `medium`) |

**Difficulty levels:**
- `easy` — Recall questions, clearly wrong distractors from related categories
- `medium` — Clinical vignette, differentials as distractors
- `hard` — Complex vignette, all options medically defensible, only one is BEST

**Response:**
```json
{
  "topic": "Heart Failure Management",
  "difficulty": "hard",
  "num_questions": 5,
  "questions": [
    {
      "id": 1,
      "question": "A 68-year-old man with EF 30%...",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "correct_answer": "A",
      "explanation": "...",
      "distractor_rationale": {"B": "...", "C": "...", "D": "..."}
    }
  ],
  "is_fallback": false,
  "cache_hit": false
}
```

---

### `POST /simulate-patient`

Multi-turn clinical patient encounter simulation.

**Request:**
```json
{
  "session_id": "student-001",
  "user_message": "Good morning. What brings you in today?",
  "case_type": "chest_pain"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | ✅ | Unique session identifier (persisted in Redis for 1h) |
| `user_message` | string | ✅ | Student's message to the patient |
| `case_type` | enum | ❌ | `chest_pain` / `abdominal_pain` / `shortness_of_breath` / `custom` |
| `custom_case` | string | ❌ | Custom patient profile (when `case_type=custom`) |

---

### `POST /predict-rank`

Hybrid rank prediction combining a rule-based scoring engine with Groq AI-generated study advice and feedback.

**Request:**
```json
{
  "student_id": "student-001",
  "scores": {
    "anatomy": 78,
    "physiology": 85,
    "biochemistry": 62,
    "pathology": 90,
    "pharmacology": 71,
    "microbiology": 68
  },
  "mock_rank": 1500,
  "total_students": 50000,
  "study_hours_per_day": 8.0,
  "months_remaining": 3.0,
  "target_college": "AIIMS Delhi"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `student_id` | string | ❌ | Student unique identifier |
| `scores` | object | ✅ | Subject scores mapping (0-100) |
| `mock_rank` | int | ❌ | Latest mock exam rank (optional) |
| `total_students` | int | ❌ | Total exam takers (default: 50000) |
| `study_hours_per_day` | float | ❌ | Hours of study per day (0–24) |
| `months_remaining` | float | ❌ | Months left until the exam (0–24) |
| `target_college` | string | ❌ | Target institution (default: AIIMS Delhi) |

**PDF Download:** Add `?download=pdf` to download the formatted PDF report.

---


### `POST /ingest/text`

Ingest raw text into the ChromaDB persistent vector store.

**Request:**
```json
{
  "text": "Hypertension is defined as sustained blood pressure...",
  "topic": "cardiology",
  "source": "hypertension_notes.txt",
  "chunk_size": 400,
  "overlap": 80
}
```

**Response:**
```json
{
  "status": "ok",
  "ingested": 12,
  "total_in_store": 31,
  "ids": ["hyper_a1b2c3d4", "hyper_e5f6g7h8", "..."]
}
```

---

### `POST /ingest/file`

Upload a `.txt` or `.md` file for ingestion.

**Form data:** `file` (upload), `topic` (string), `chunk_size` (int), `overlap` (int)

---

### `GET /health`

Live health probe for all service components.

**Response:**
```json
{
  "status": "healthy",
  "model": "llama-3.1-70b-versatile",
  "groq_api": "ok",
  "fallback_mode": false,
  "redis": "connected",
  "cache_stats": {"hits": 45, "misses": 12, "hit_rate_pct": 78.9},
  "chroma_db": {"status": "ready", "total_documents": 19, "collection": "medical_knowledge"},
  "rag_stats": {"total_queries": 23, "embedding_cache_hits": 18, "avg_latency_ms": 142.3}
}
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and fill in your values:

```env
# Required
GROQ_API_KEY=gsk_your_key_here

# Optional (with defaults)
GROQ_MODEL=llama-3.1-70b-versatile
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL=900          # 15 minutes
APP_ENV=development
```

---

## 🗃️ Caching

Two-level caching strategy:

| Level | Store | TTL | Key |
|---|---|---|---|
| **Response cache** | Redis | 15 min | SHA-256 of prompt |
| **Embedding cache** | Redis | 60 min | SHA-256 of text |

Response headers indicate cache status:
- `X-Cache: HIT` — served from Redis
- `X-Cache: MISS` — freshly generated
- `X-Process-Time-Ms: 342.1` — total request latency
- `X-Fallback: true` — Groq was unavailable, static response served

---

## 📚 RAG System

The RAG (Retrieval-Augmented Generation) system uses a **two-tier retrieval** strategy:

1. **ChromaDB** (primary) — persistent vector store, seeded on startup, augmented via `/ingest`
2. **In-memory fallback** — 19-chunk static knowledge base, always available

**Batch embedding optimization (Day 12):**
- Multiple queries embedded in parallel using `sentence-transformers` batch mode
- Redis caches individual text embeddings (1 hour TTL)
- Repeated questions skip the embedding model entirely

**Retrieval flow:**
```
Query → Redis embedding cache?
      → HIT: use cached embedding
      → MISS: embed with model → cache result
      → ChromaDB cosine similarity search
      → Return top-K chunks with scores
```

---

## 📤 Document Ingestion

Upload your own medical study materials and make them searchable:

```bash
# Upload raw text
curl -X POST http://localhost:8000/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hypertension is defined as...",
    "topic": "cardiology",
    "source": "my_notes.txt"
  }'

# Upload a file
curl -X POST http://localhost:8000/ingest/file \
  -F "file=@notes.txt" \
  -F "topic=pharmacology"

# Check store size
curl http://localhost:8000/ingest/stats
```

Ingested documents are **immediately searchable** via `/tutor/ask`.

---

## 🧪 Testing

```bash
# Run all unit tests
pytest tests/ -v

# Prompt QA evaluation (scores all endpoints ≥ 4/5)
pytest tests/test_prompt_qa.py -v

# Load test (requires running server)
locust -f tests/locustfile.py --host=http://localhost:8000 \
       --users=50 --spawn-rate=5 --run-time=60s --headless
```

---

## 🐳 Docker

### Development
```bash
docker compose up --build
```

### Production
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Cold start test
```bash
time docker compose up --build --no-deps ai-service
```

**Services:**
| Service | Port | Notes |
|---|---|---|
| `ai-service` | 8000 | FastAPI + Uvicorn |
| `redis` | 6379 | Response + embedding cache |

---

## 📊 Performance Targets

| Metric | Target | Validated |
|---|---|---|
| p95 latency (tutor endpoints) | < 2s | ✅ Day 16 |
| Cold start time | < 30s | ✅ Day 17 |
| RAG retrieval latency | < 200ms | ✅ Day 12 |
| Groq fallback on API down | 100% | ✅ Day 11 |

---

## 📁 Project Structure

```
groq-ai-service/
├── app/
│   ├── main.py                    # FastAPI app, lifespan, middleware
│   ├── config.py                  # Settings (pydantic-settings)
│   ├── groq_client.py             # Groq API client with retry/fallback
│   ├── cache.py                   # Redis cache layer
│   ├── fallback_responses.py      # Static AI fallbacks
│   ├── rank_engine.py             # Rank prediction engine
│   ├── pdf_generator.py           # PDF export utilities
│   ├── rag/
│   │   ├── embeddings.py          # In-memory RAG (fallback)
│   │   ├── chroma_store.py        # ChromaDB persistent vector store (Day 11)
│   │   ├── optimized_retriever.py # Batch embedding + Redis cache (Day 12)
│   │   └── seed.py                # Startup knowledge base seeder (Day 11)
│   ├── routers/
│   │   ├── tutor.py               # /tutor/explain, /tutor/ask
│   │   ├── mcq.py                 # /generate-mcq
│   │   ├── patient.py             # /simulate-patient
│   │   ├── rank.py                # /rank/predict
│   │   └── ingest.py              # /ingest/* (Day 11)
│   ├── prompts/
│   │   ├── tutor_prompts.py       # Explain + RAG prompts
│   │   ├── mcq_prompts.py         # MCQ prompts with distractor rules (Day 13)
│   │   ├── patient_prompts.py     # Patient simulation prompts
│   │   └── rank_prompts.py        # Rank prediction prompts
│   └── static/
│       └── download.html          # PDF download UI
├── tests/
│   ├── test_prompt_qa.py          # Prompt QA evaluation (Day 15)
│   └── locustfile.py              # Load testing (Day 16)
├── docs/
│   └── API_REFERENCE.md           # Detailed API documentation
├── Dockerfile                     # Multi-stage production Docker build (Day 17)
├── docker-compose.yml             # Development compose
├── docker-compose.prod.yml        # Production compose (Day 17)
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes, run tests: `pytest tests/ -v`
4. Open a pull request

## 📄 License

MIT — see `LICENSE` for details.
