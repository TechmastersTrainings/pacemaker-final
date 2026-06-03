"""
Tutor router – Task 2, 3 & Day 12 (Optimized RAG)
- POST /tutor/explain  → AI explanation with caching
- POST /tutor/ask      → Optimized RAG-augmented Q&A with batch embedding + ChromaDB
"""
import logging
from typing import Literal, Optional

from fastapi import APIRouter, Response, Query
from fastapi.responses import StreamingResponse
import io
from pydantic import BaseModel, Field
from app.pdf_generator import build_explain_pdf, build_ask_pdf

from app.groq_client import get_groq_client
from app.cache import get_cache, CacheStats
from app.rag.optimized_retriever import get_optimized_rag
from app.prompts.tutor_prompts import (
    EXPLAIN_SYSTEM,
    EXPLAIN_USER_TEMPLATE,
    RAG_SYSTEM,
    RAG_USER_TEMPLATE,
)
from app.fallback_responses import (
    TUTOR_EXPLAIN_FALLBACK,
    TUTOR_ASK_FALLBACK,
    TUTOR_ASK_FALLBACK_SOURCES,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tutor", tags=["Tutor"])

LevelType = Literal["beginner", "intermediate", "advanced"]


# ── Request / Response Models ─────────────────────────────────────────────────

class ExplainRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=500, examples=["Myocardial Infarction"])
    level: LevelType = Field(default="intermediate")
    context: Optional[str] = Field(default="", max_length=1000)


class ExplainResponse(BaseModel):
    topic: str
    level: str
    explanation: str
    is_fallback: bool
    cache_hit: bool


class AskRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=1000)
    level: LevelType = Field(default="intermediate")
    top_k: int = Field(default=3, ge=1, le=5)


class AskResponse(BaseModel):
    question: str
    answer: str
    sources: list[dict]
    is_fallback: bool
    cache_hit: bool


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/explain", response_model=None, summary="Explain a medical topic")
async def explain_topic(
    req: ExplainRequest,
    response: Response,
    download: Optional[str] = Query(default=None, description="Set to 'pdf' to download response as PDF"),
):
    """
    **Task 2** – Generate a structured AI explanation for any medical topic.
    Supports beginner / intermediate / advanced levels.
    Results are Redis-cached (15 min) keyed by SHA-256 of the prompt.
    """
    client = get_groq_client()
    cache = get_cache()

    user_prompt = EXPLAIN_USER_TEMPLATE.format(
        topic=req.topic,
        level=req.level,
        context=req.context or "None",
    )
    cache_key = client.make_cache_key(f"explain:{user_prompt}")

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        response.headers["X-Cache"] = "HIT"
        response.headers["X-Cache-Stats"] = str(CacheStats.summary())
        return ExplainResponse(cache_hit=True, **cached)

    # Call Groq – use topic-specific fallback if AI is unavailable
    content, is_fallback = client.system_user(
        system_prompt=EXPLAIN_SYSTEM,
        user_prompt=user_prompt,
        fallback=TUTOR_EXPLAIN_FALLBACK,
    )

    if is_fallback:
        logger.warning("[/tutor/explain] Groq unavailable – serving static fallback for topic '%s'", req.topic)

    result = {
        "topic": req.topic,
        "level": req.level,
        "explanation": content,
        "is_fallback": is_fallback,
    }
    # Only cache successful responses, not fallbacks
    if not is_fallback:
        cache.set(cache_key, result)

    response.headers["X-Cache"] = "MISS"
    response.headers["X-Cache-Stats"] = str(CacheStats.summary())
    if is_fallback:
        response.headers["X-Fallback"] = "true"

    # PDF download
    if download and download.lower() == "pdf":
        pdf_bytes = build_explain_pdf({**result, "cache_hit": False})
        filename = f"explain_{req.topic.replace(' ', '_').lower()}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    return ExplainResponse(cache_hit=False, **result)


@router.post("/ask", response_model=None, summary="RAG-powered Q&A")
async def ask_question(
    req: AskRequest,
    response: Response,
    download: Optional[str] = Query(default=None, description="Set to 'pdf' to download response as PDF"),
):
    """
    **Task 3** – Retrieval-Augmented Generation:
    1. Embeds the question with sentence-transformers
    2. Retrieves top-K chunks from the medical knowledge base
    3. Injects context into Groq prompt and returns a grounded answer
    """
    client = get_groq_client()
    cache = get_cache()
    rag = get_optimized_rag()

    # Retrieve context chunks (ChromaDB-backed, with embedding cache)
    chunks = rag.retrieve(req.question, top_k=req.top_k)
    context_text = "\n\n".join(
        [f"[Chunk {i+1} – {c.topic} (score: {c.score:.2f}, src: {c.source})]:\n{c.text}"
         for i, c in enumerate(chunks)]
    )

    user_prompt = RAG_USER_TEMPLATE.format(
        context=context_text,
        question=req.question,
        level=req.level,
    )
    cache_key = client.make_cache_key(f"ask:{user_prompt}")

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        response.headers["X-Cache"] = "HIT"
        response.headers["X-Cache-Stats"] = str(CacheStats.summary())
        return AskResponse(cache_hit=True, **cached)

    # Call Groq – use topic-specific fallback if AI is unavailable
    content, is_fallback = client.system_user(
        system_prompt=RAG_SYSTEM,
        user_prompt=user_prompt,
        fallback=TUTOR_ASK_FALLBACK,
    )

    if is_fallback:
        logger.warning("[/tutor/ask] Groq unavailable – serving static fallback for question: %s", req.question[:60])

    # Use real RAG sources when available, otherwise show fallback sources
    sources = (
        [{"id": c.id, "topic": c.topic, "score": round(c.score, 3), "source": c.source} for c in chunks]
        if not is_fallback
        else TUTOR_ASK_FALLBACK_SOURCES
    )

    result = {
        "question": req.question,
        "answer": content,
        "sources": sources,
        "is_fallback": is_fallback,
    }
    # Only cache successful responses, not fallbacks
    if not is_fallback:
        cache.set(cache_key, result)

    response.headers["X-Cache"] = "MISS"
    response.headers["X-Cache-Stats"] = str(CacheStats.summary())
    if is_fallback:
        response.headers["X-Fallback"] = "true"

    # PDF download
    if download and download.lower() == "pdf":
        pdf_bytes = build_ask_pdf({**result, "cache_hit": False})
        filename = f"rag_answer_{req.question[:30].replace(' ', '_').lower()}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    return AskResponse(cache_hit=False, **result)
