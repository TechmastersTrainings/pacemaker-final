"""
fallback_responses.py – Task 6
==============================
Central store of all static fallback responses for every AI endpoint.

When Groq is unavailable (rate-limit, timeout, API error), each router
imports its fallback from here instead of crashing.  Every response:
  - Tells the user the AI is temporarily down
  - Provides enough structure to keep the response schema valid
  - Sets  is_fallback=True  so callers can detect and log the situation
"""

# ── /tutor/explain ─────────────────────────────────────────────────────────────

TUTOR_EXPLAIN_FALLBACK = (
    "⚠️ **AI Service Temporarily Unavailable**\n\n"
    "The Groq AI model could not be reached at this time (rate limit, timeout, or API error).\n\n"
    "**What you can do right now:**\n"
    "- Retry the request in 30–60 seconds – the service usually recovers quickly.\n"
    "- Check `/health` to see the current status of the AI and Redis layers.\n"
    "- Browse the Swagger UI at `/docs` to explore other available endpoints.\n\n"
    "We apologise for the inconvenience.  Your query has been logged and will not "
    "consume any cache quota."
)


# ── /tutor/ask ─────────────────────────────────────────────────────────────────

TUTOR_ASK_FALLBACK = (
    "⚠️ **AI Service Temporarily Unavailable**\n\n"
    "The RAG-augmented Q&A pipeline could not reach the Groq model at this time.\n\n"
    "**Suggested steps:**\n"
    "1. Wait 30–60 seconds and retry – transient errors self-resolve.\n"
    "2. Simplify or rephrase your question and try again.\n"
    "3. Check `/health` for the current system status.\n\n"
    "Your question was received but an AI-generated answer is not available right now."
)

TUTOR_ASK_FALLBACK_SOURCES: list[dict] = [
    {
        "id": "fallback-001",
        "topic": "Service Unavailable",
        "score": 0.0,
        "note": "No RAG retrieval was performed – AI backend offline.",
    }
]


# ── /generate-mcq ──────────────────────────────────────────────────────────────

MCQ_FALLBACK_QUESTIONS = [
    {
        "id": 1,
        "question": "⚠️ AI service is currently unavailable. Which of the following best describes the current system state?",
        "options": {
            "A": "The service is fully operational",
            "B": "The Groq AI backend is temporarily unavailable",
            "C": "Redis is offline",
            "D": "The FastAPI server has crashed",
        },
        "correct_answer": "B",
        "explanation": (
            "The Groq AI backend returned an error or timed out after 3 retry attempts. "
            "The FastAPI server and Redis remain operational.  Please retry in 30–60 seconds."
        ),
    }
]

MCQ_FALLBACK_TOPIC   = "Service Unavailable – Static Fallback"
MCQ_FALLBACK_DIFFICULTY = "N/A"


# ── /simulate-patient ──────────────────────────────────────────────────────────

PATIENT_FALLBACK_RESPONSE = (
    "*[The patient looks uncomfortable and gestures apologetically.]*\n\n"
    "I'm sorry, doctor... I'm not feeling well enough to continue right now. "
    "Could we perhaps resume this consultation in a few moments?\n\n"
    "*(The AI patient simulation is temporarily offline.  "
    "Please retry in 30–60 seconds.  "
    "Your session history is preserved in Redis and will be available when the service recovers.)*"
)


# ── /predict-rank ──────────────────────────────────────────────────────────────

RANK_AI_FALLBACK = (
    "⚠️ **AI Analysis Temporarily Unavailable**\n\n"
    "The Groq AI model could not generate a qualitative rank analysis at this time.  "
    "However, your **rule-based rank prediction above is fully accurate** – it uses only "
    "local math (weighted scores, percentile tables) and does not depend on the AI service.\n\n"
    "**What the rule-based engine already gives you:**\n"
    "- Weighted composite score across all subjects\n"
    "- Percentile rank and predicted rank range\n"
    "- Performance band (Top / Good / Average / Below Average)\n"
    "- Subject-wise strength & weakness breakdown\n\n"
    "**To get the full AI narrative analysis:**\n"
    "- Retry this request in 30–60 seconds.\n"
    "- The AI layer adds personalised study plans and college-specific advice on top of the numbers."
)


# ── Generic / /health ──────────────────────────────────────────────────────────

GENERIC_FALLBACK = (
    "⚠️ The AI service is temporarily unavailable.  "
    "Please retry in 30–60 seconds.  "
    "All other service components (API, Redis, rule engines) remain operational."
)

# Human-readable label used in /health endpoint
GROQ_STATUS_UNAVAILABLE = "unavailable – fallback mode active"
GROQ_STATUS_OK          = "connected"
