"""
MCQ router – Task 4 / Day 13 (Tuned Distractor Quality)
POST /generate-mcq → Structured MCQs with viable distractors and clinical rationale
"""
import io
import json
import logging
from typing import Literal, Optional

from fastapi import APIRouter, Response, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.groq_client import get_groq_client
from app.cache import get_cache, CacheStats
from app.prompts.mcq_prompts import MCQ_SYSTEM, build_mcq_user_prompt
from app.pdf_generator import build_mcq_pdf
from app.fallback_responses import (
    MCQ_FALLBACK_QUESTIONS,
    MCQ_FALLBACK_TOPIC,
    MCQ_FALLBACK_DIFFICULTY,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["MCQ Generator"])

DifficultyType = Literal["easy", "medium", "hard", "exam-level"]


# ── Models ────────────────────────────────────────────────────────────────────

class MCQRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=300, examples=["Heart Failure Management"])
    num_questions: int = Field(default=5, ge=1, le=10)
    difficulty: DifficultyType = Field(default="medium")


class MCQOption(BaseModel):
    A: str
    B: str
    C: str
    D: str


class MCQQuestion(BaseModel):
    id: int
    question: str
    options: MCQOption
    correct_answer: str
    explanation: str
    distractor_rationale: Optional[dict] = None


class MCQResponse(BaseModel):
    topic: str
    difficulty: str
    num_questions: int
    questions: list[MCQQuestion]
    is_fallback: bool
    cache_hit: bool


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post(
    "/generate-mcq",
    response_model=None,
    summary="Generate multiple choice questions",
)
async def generate_mcq(
    req: MCQRequest,
    response: Response,
    download: Optional[str] = Query(default=None, description="Set to 'pdf' to download response as PDF"),
):
    """
    **Task 4** – Generate *num_questions* MCQs on a medical *topic*.
    Returns structured JSON with questions, options, correct answer, and explanations.
    Responses are Redis-cached for 15 minutes.
    """
    client = get_groq_client()
    cache = get_cache()

    user_prompt = build_mcq_user_prompt(
        topic=req.topic,
        num_questions=req.num_questions,
        difficulty=req.difficulty,
    )
    cache_key = client.make_cache_key(f"mcq:{user_prompt}")

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        response.headers["X-Cache"] = "HIT"
        response.headers["X-Cache-Stats"] = str(CacheStats.summary())
        return MCQResponse(cache_hit=True, **cached)

    # Call Groq (lower temperature for consistent JSON)
    raw, is_fallback = client.system_user(
        system_prompt=MCQ_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.3,
        max_tokens=3000,
    )

    if is_fallback:
        logger.warning("[/generate-mcq] Groq unavailable – serving static fallback MCQ for topic '%s'", req.topic)
        fallback_result = {
            "topic": MCQ_FALLBACK_TOPIC,
            "difficulty": MCQ_FALLBACK_DIFFICULTY,
            "num_questions": len(MCQ_FALLBACK_QUESTIONS),
            "questions": MCQ_FALLBACK_QUESTIONS,
            "is_fallback": True,
        }
        response.headers["X-Cache"] = "MISS"
        response.headers["X-Fallback"] = "true"
        if download and download.lower() == "pdf":
            pdf_bytes = build_mcq_pdf(fallback_result)
            filename = f"mcq_fallback_{req.topic.replace(' ', '_').lower()}.pdf"
            return StreamingResponse(
                io.BytesIO(pdf_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
        return MCQResponse(cache_hit=False, **fallback_result)

    # Parse JSON response
    try:
        # Strip markdown fences if present
        clean = raw.strip()
        if clean.startswith("```"):
            clean = "\n".join(clean.split("\n")[1:])
        if clean.endswith("```"):
            clean = "\n".join(clean.split("\n")[:-1])
        parsed = json.loads(clean)
    except json.JSONDecodeError as exc:
        logger.error("MCQ JSON parse error: %s\nRaw: %s", exc, raw[:500])
        raise HTTPException(
            status_code=422,
            detail=f"AI returned malformed JSON. Please retry. Error: {str(exc)}",
        )

    result = {
        "topic": parsed.get("topic", req.topic),
        "difficulty": parsed.get("difficulty", req.difficulty),
        "num_questions": len(parsed.get("questions", [])),
        "questions": parsed.get("questions", []),
        "is_fallback": False,
    }
    cache.set(cache_key, result)

    response.headers["X-Cache"] = "MISS"
    response.headers["X-Cache-Stats"] = str(CacheStats.summary())

    # PDF download
    if download and download.lower() == "pdf":
        pdf_bytes = build_mcq_pdf(result)
        filename = f"mcq_{req.topic.replace(' ', '_').lower()}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    return MCQResponse(cache_hit=False, **result)
