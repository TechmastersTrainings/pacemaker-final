# 📖 API Reference — Groq Medical AI Service

**Base URL:** `http://localhost:8000`  
**Docs:** `http://localhost:8000/docs` (Swagger) | `http://localhost:8000/redoc` (ReDoc)  
**Version:** 1.0.0

---

## Common Response Headers

All endpoints return these headers:

| Header | Value | Description |
|---|---|---|
| `X-Cache` | `HIT` / `MISS` | Redis cache status |
| `X-Process-Time-Ms` | `342.1` | Total request latency in milliseconds |
| `X-Cache-Stats` | `{...}` | Running hit/miss counters |
| `X-Fallback` | `true` | Present when Groq AI was unavailable |

---

## Endpoint Groups

- [🎓 Tutor](#-tutor-endpoints)
- [📝 MCQ Generator](#-mcq-generator)
- [🏥 Patient Simulation](#-patient-simulation)
- [📊 Rank Prediction](#-rank-prediction)
- [📚 Document Ingestion](#-document-ingestion)
- [⚙️ System](#️-system-endpoints)

---

## 🎓 Tutor Endpoints

### `POST /tutor/explain`

Generates a structured AI explanation for any medical topic, adapted to the student's level.

**Request Body:**

```json
{
  "topic": "string (2–500 chars, required)",
  "level": "beginner | intermediate | advanced (default: intermediate)",
  "context": "string (optional, max 1000 chars)"
}
```

**Response `200 OK`:**

```json
{
  "topic": "Myocardial Infarction",
  "level": "intermediate",
  "explanation": "**Core Concept**\n\nMyocardial infarction occurs when...",
  "is_fallback": false,
  "cache_hit": false
}
```

**Response structure:**

| Field | Type | Description |
|---|---|---|
| `topic` | string | Echo of request topic |
| `level` | string | Echo of request level |
| `explanation` | string | Structured markdown explanation (4 sections) |
| `is_fallback` | bool | True if Groq was down and static response used |
| `cache_hit` | bool | True if served from Redis |

**PDF Export:** `POST /tutor/explain?download=pdf` returns `application/pdf`

**Error Codes:**

| Code | Meaning |
|---|---|
| `422` | Request validation failed (topic too short, invalid level) |
| `500` | Unexpected server error |

---

### `POST /tutor/ask`

RAG-augmented Q&A. Embeds the question, retrieves relevant chunks from ChromaDB, and generates a grounded answer.

**Request Body:**

```json
{
  "question": "string (5–1000 chars, required)",
  "level": "beginner | intermediate | advanced (default: intermediate)",
  "top_k": "integer 1–5 (default: 3)"
}
```

**Response `200 OK`:**

```json
{
  "question": "What is the treatment for STEMI?",
  "answer": "Based on the retrieved context...",
  "sources": [
    {
      "id": "kb_a1b2c3d4",
      "topic": "cardiology",
      "score": 0.923,
      "source": "knowledge_base_seed"
    }
  ],
  "is_fallback": false,
  "cache_hit": false
}
```

**Sources field:**

| Sub-field | Description |
|---|---|
| `id` | ChromaDB document chunk ID |
| `topic` | Medical topic of the chunk |
| `score` | Cosine similarity (0.0–1.0, higher = more relevant) |
| `source` | Origin (`knowledge_base_seed`, `chromadb`, `in_memory`, or filename) |

**PDF Export:** `POST /tutor/ask?download=pdf`

---

## 📝 MCQ Generator

### `POST /generate-mcq`

Generates clinically valid MCQs with plausible distractors and educational rationale.

**Request Body:**

```json
{
  "topic": "string (3–300 chars, required)",
  "num_questions": "integer 1–10 (default: 5)",
  "difficulty": "easy | medium | hard (default: medium)"
}
```

**Difficulty Specification:**

| Level | Format | Distractor Strategy |
|---|---|---|
| `easy` | Direct recall question | Same drug class / related conditions |
| `medium` | 3–5 sentence clinical vignette | Differentials in same pathway |
| `hard` | 4–6 sentence complex vignette | All options medically defensible |

**Response `200 OK`:**

```json
{
  "topic": "Heart Failure Management",
  "difficulty": "hard",
  "num_questions": 2,
  "questions": [
    {
      "id": 1,
      "question": "A 68-year-old man with ischaemic cardiomyopathy (EF 28%) presents with worsening dyspnoea. He is already on maximum-dose ACE inhibitor and beta-blocker. Which agent should be added next?",
      "options": {
        "A": "Spironolactone",
        "B": "Furosemide",
        "C": "Digoxin",
        "D": "Amlodipine"
      },
      "correct_answer": "A",
      "explanation": "Mineralocorticoid receptor antagonists (MRAs) like spironolactone reduce mortality in HFrEF when added to ACE inhibitors and beta-blockers (RALES trial). The next step in guideline-directed therapy is an MRA, not a diuretic (which manages symptoms but not mortality).",
      "distractor_rationale": {
        "B": "Furosemide relieves congestion symptoms but does not improve mortality in HFrEF — already implied as needed for symptom control.",
        "C": "Digoxin can reduce hospitalisations but is not a mortality-reducing agent and is not guideline-recommended as next-step add-on.",
        "D": "Amlodipine (CCB) has neutral evidence in HF and is generally avoided as it may worsen outcomes in HFrEF."
      }
    }
  ],
  "is_fallback": false,
  "cache_hit": false
}
```

**Error Codes:**

| Code | Meaning |
|---|---|
| `422` | Groq returned malformed JSON — retry |
| `503` | Service unavailable (static fallback served) |

**PDF Export:** `POST /generate-mcq?download=pdf`

---

## 🏥 Patient Simulation

### `POST /simulate-patient`

Multi-turn clinical encounter simulation. The AI roleplays as a patient based on a clinical case profile.

**Request Body:**

```json
{
  "session_id": "string (required) — unique conversation ID",
  "user_message": "string (required) — what the student says",
  "case_type": "chest_pain | abdominal_pain | shortness_of_breath | custom (default: chest_pain)",
  "custom_case": "string (optional) — custom patient profile when case_type=custom"
}
```

**Available Cases:**

| Case | Patient | Diagnosis |
|---|---|---|
| `chest_pain` | Mr. Carter, 52M | STEMI |
| `abdominal_pain` | Ms. Sharma, 28F | Ectopic pregnancy / appendicitis |
| `shortness_of_breath` | Mr. Okafor, 68M | Acute decompensated heart failure |

**Response `200 OK`:**

```json
{
  "session_id": "student-001",
  "patient_response": "I... I've been having this horrible chest pain for the past two hours. It started suddenly while I was watching TV.",
  "message_count": 2,
  "case_type": "chest_pain",
  "is_fallback": false
}
```

**Session persistence:**
- Conversations are stored in Redis with **1-hour TTL**
- Same `session_id` = continue same conversation
- New `session_id` = fresh patient encounter

### `GET /simulate-patient/cases`

Returns available clinical cases.

**Response `200 OK`:**
```json
{
  "available_cases": ["chest_pain", "abdominal_pain", "shortness_of_breath", "custom"],
  "total": 4
}
```

---

## 📊 Rank Prediction

### `POST /predict-rank`

Hybrid rank prediction combining a rule-based scoring engine (weighted scores, percentile calculation, and predicted rank ranges) with Groq AI-generated qualitative feedback, target college assessment, and customized study plan.

**Request Body:**

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

**Request Parameters:**

| Field | Type | Required | Description |
|---|---|---|---|
| `student_id` | string | ❌ | Unique student identifier (default: `student-001`) |
| `scores` | object | ✅ | Mapping of subject name strings to numeric scores (0-100) |
| `mock_rank` | integer | ❌ | Latest mock exam rank (optional, `>= 1`) |
| `total_students` | integer | ❌ | Total students appearing in the exam (default: `50000`, `>= 100`) |
| `study_hours_per_day` | float | ❌ | Daily study hours (default: `8.0`, range `0`–`24`) |
| `months_remaining` | float | ❌ | Months remaining until the exam (default: `3.0`, range `0`–`24`) |
| `target_college` | string | ❌ | Target medical college or exam goal (default: `AIIMS Delhi`) |

**Response `200 OK`:**

```json
{
  "student_id": "student-001",
  "rule_based": {
    "weighted_score": 77.17,
    "percentile": 92.4,
    "predicted_rank_min": 3500,
    "predicted_rank_max": 4200,
    "performance_band": "Excellent",
    "weak_subjects": ["biochemistry", "microbiology"],
    "strong_subjects": ["pathology", "physiology"],
    "subject_breakdown": {
      "anatomy": { "score": 78.0, "status": "Strong" },
      "biochemistry": { "score": 62.0, "status": "Weak" }
    }
  },
  "ai_inference": {
    "analysis": "Based on your scores, you have strong foundations in pathology and physiology. Focus on biochemistry...",
    "is_fallback": false
  },
  "combined_prediction": "Rank 3,500 – 4,200 (Excellent | 92.4th percentile)",
  "is_fallback": false,
  "cache_hit": false
}
```

**PDF Export:** `POST /predict-rank?download=pdf` returns the PDF report directly as an attachment.

---

## 📚 Document Ingestion

### `POST /ingest/text`

Ingest raw text into ChromaDB for RAG retrieval.

**Request Body:**

```json
{
  "text": "string (min 20 chars, required)",
  "topic": "string (default: general)",
  "source": "string (default: manual_upload)",
  "chunk_size": "integer 100–2000 (default: 400)",
  "overlap": "integer 0–400 (default: 80)"
}
```

**Response `200 OK`:**

```json
{
  "status": "ok",
  "ingested": 8,
  "total_in_store": 27,
  "ids": ["src_a1b2c3d4", "src_e5f6g7h8"]
}
```

---

### `POST /ingest/file`

Upload a text file for ingestion.

**Form Data:**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | ✅ | `.txt` or `.md` file |
| `topic` | string | ❌ | Medical topic label |
| `chunk_size` | int | ❌ | Chunk size (default: 400) |
| `overlap` | int | ❌ | Overlap (default: 80) |

**Supported formats:** `.txt`, `.md`  
**Max encoding:** UTF-8 (falls back to Latin-1)

**Error Codes:**

| Code | Meaning |
|---|---|
| `400` | File content too short |
| `415` | Unsupported file type |
| `503` | ChromaDB unavailable |

---

### `GET /ingest/stats`

Returns ChromaDB vector store statistics.

**Response `200 OK`:**
```json
{
  "status": "ready",
  "collection": "medical_knowledge",
  "total_documents": 27,
  "persist_dir": "/app/chroma_data"
}
```

---

### `DELETE /ingest/clear`

⚠️ **Destructive** — drops and recreates the ChromaDB collection.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "message": "Collection cleared"
}
```

---

## ⚙️ System Endpoints

### `GET /health`

Live health probe for all service components.

**Response `200 OK`:**

```json
{
  "status": "healthy",
  "model": "llama-3.1-70b-versatile",
  "groq_api": "ok",
  "fallback_mode": false,
  "redis": "connected",
  "cache_stats": {
    "hits": 45,
    "misses": 12,
    "hit_rate_pct": 78.9
  },
  "chroma_db": {
    "status": "ready",
    "collection": "medical_knowledge",
    "total_documents": 27,
    "persist_dir": "/app/chroma_data"
  },
  "rag_stats": {
    "total_queries": 23,
    "embedding_cache_hits": 18,
    "avg_latency_ms": 142.3
  }
}
```

**Status values:**

| `status` | Meaning |
|---|---|
| `healthy` | All systems operational |
| `degraded` | Groq API unreachable, fallback mode active |

---

### `GET /cache/stats`

Redis cache performance counters.

**Response `200 OK`:**
```json
{
  "cache_hits": 45,
  "cache_misses": 12,
  "hit_rate_pct": 78.9,
  "ttl_seconds": 900,
  "redis_available": true
}
```

---

### `GET /`

API root — returns service info and endpoint list.

### `GET /docs`

Swagger UI — interactive API documentation.

### `GET /redoc`

ReDoc — alternative API documentation.

### `GET /download`

PDF download UI page.

---

## Error Reference

| HTTP Code | Scenario | Response |
|---|---|---|
| `400` | Bad request (invalid input) | `{"detail": "..."}` |
| `404` | Resource not found | `{"detail": "Not Found"}` |
| `415` | Unsupported media type | `{"detail": "Unsupported file type..."}` |
| `422` | Validation error | `{"detail": [{"loc": [...], "msg": "..."}]}` |
| `500` | Unhandled server error | `{"detail": "An internal server error occurred..."}` |
| `503` | External service unavailable | `{"detail": "ChromaDB not available"}` |

> **Note:** Most 503-type scenarios are handled gracefully by serving static fallback responses rather than returning error codes.

---

## Rate Limits

No rate limits are enforced at the API level. Groq API has its own rate limits:
- Free tier: ~30 requests/minute
- Caching significantly reduces Groq API calls for repeated queries

---

*Last updated: Day 14 documentation pass*
