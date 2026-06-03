"""
Rank Prediction router – /predict-rank
Combines rule-based scoring engine with Groq AI inference.
"""
import io
import logging
from typing import Optional

from fastapi import APIRouter, Response, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.groq_client import get_groq_client
from app.cache import get_cache, CacheStats
from app.rank_engine import run_rule_engine
from app.prompts.rank_prompts import RANK_SYSTEM, RANK_USER_TEMPLATE
from app.pdf_generator import build_rank_pdf
from app.fallback_responses import RANK_AI_FALLBACK

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Rank Predictor"])


# ── Request / Response Models ─────────────────────────────────────────────────

class RankRequest(BaseModel):
    student_id: str = Field(
        default="student-001",
        min_length=2, max_length=100,
        description="Unique student identifier",
        examples=["student-001"],
    )
    scores: dict[str, float] = Field(
        ...,
        description="Subject name → score (0–100) mapping",
        examples=[{
            "anatomy": 78, "physiology": 85, "biochemistry": 62,
            "pathology": 90, "pharmacology": 71, "microbiology": 68
        }],
    )
    mock_rank: Optional[int] = Field(
        default=None, ge=1,
        description="Latest mock exam rank (optional)",
    )
    total_students: int = Field(
        default=50000, ge=100,
        description="Total students appearing in the exam",
    )
    study_hours_per_day: float = Field(
        default=8.0, ge=0, le=24,
        description="Daily study hours",
    )
    months_remaining: float = Field(
        default=3.0, ge=0, le=24,
        description="Months remaining until the exam",
    )
    target_college: str = Field(
        default="AIIMS Delhi",
        max_length=200,
        description="Target medical college or exam goal",
    )


class RuleBasedOut(BaseModel):
    weighted_score: float
    percentile: float
    predicted_rank_min: int
    predicted_rank_max: int
    performance_band: str
    weak_subjects: list[str]
    strong_subjects: list[str]
    subject_breakdown: dict


class AIInferenceOut(BaseModel):
    analysis: str
    is_fallback: bool


class RankResponse(BaseModel):
    student_id: str
    rule_based: RuleBasedOut
    ai_inference: AIInferenceOut
    combined_prediction: str
    is_fallback: bool
    cache_hit: bool


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post(
    "/predict-rank",
    response_model=None,
    summary="Predict student exam rank (rule-based + AI)",
)
async def predict_rank(
    req: RankRequest,
    response: Response,
    download: Optional[str] = Query(
        default=None,
        description="Set to 'pdf' to download the report as a PDF",
    ),
):
    """
    **Predict Rank** – Combines two methods:

    1. **Rule-Based Engine**: Weighted score → percentile → rank range (instant).
    2. **Groq AI Inference**: Qualitative analysis, weak-subject advice,
       target-college assessment, and a study plan.

    Responses are Redis-cached for 15 minutes.
    Add `?download=pdf` to get a formatted PDF report.
    """
    client = get_groq_client()
    cache  = get_cache()

    # ── 1. Rule-based engine (always runs, no API call) ───────────────────────
    rule = run_rule_engine(
        scores=req.scores,
        mock_rank=req.mock_rank,
        total_students=req.total_students,
    )

    # ── 2. Build cache key ────────────────────────────────────────────────────
    cache_key = client.make_cache_key(
        f"rank:{req.student_id}:{req.scores}:{req.mock_rank}:{req.months_remaining}"
    )

    cached = cache.get(cache_key)
    if cached:
        response.headers["X-Cache"] = "HIT"
        response.headers["X-Cache-Stats"] = str(CacheStats.summary())
        rank_resp = RankResponse(cache_hit=True, **cached)
        if download and download.lower() == "pdf":
            return _pdf_response(rank_resp, req.student_id)
        return rank_resp

    # ── 3. AI inference via Groq ──────────────────────────────────────────────
    scores_text = "\n".join(
        f"  • {subj.capitalize()}: {score}/100"
        for subj, score in req.scores.items()
    )
    user_prompt = RANK_USER_TEMPLATE.format(
        student_id=req.student_id,
        scores_text=scores_text,
        weighted_score=rule.weighted_score,
        mock_rank=req.mock_rank or "Not provided",
        total_students=req.total_students,
        study_hours=req.study_hours_per_day,
        months_remaining=req.months_remaining,
        target_college=req.target_college,
        weak_subjects=", ".join(rule.weak_subjects) or "None",
        strong_subjects=", ".join(rule.strong_subjects) or "None",
        rank_min=rule.predicted_rank_min,
        rank_max=rule.predicted_rank_max,
    )

    ai_text, is_fallback = client.system_user(
        system_prompt=RANK_SYSTEM,
        user_prompt=user_prompt,
        max_tokens=1500,
        temperature=0.4,
        fallback=RANK_AI_FALLBACK,
    )

    if is_fallback:
        logger.warning(
            "[/predict-rank] Groq unavailable – serving static AI fallback for student '%s'. "
            "Rule-based result is still accurate.",
            req.student_id,
        )

    # ── 4. Build combined prediction label ────────────────────────────────────
    combined = (
        f"Rank {rule.predicted_rank_min:,} – {rule.predicted_rank_max:,} "
        f"({rule.performance_band} | {rule.percentile:.1f}th percentile)"
    )

    result = {
        "student_id": req.student_id,
        "rule_based": {
            "weighted_score":    rule.weighted_score,
            "percentile":        rule.percentile,
            "predicted_rank_min": rule.predicted_rank_min,
            "predicted_rank_max": rule.predicted_rank_max,
            "performance_band":  rule.performance_band,
            "weak_subjects":     rule.weak_subjects,
            "strong_subjects":   rule.strong_subjects,
            "subject_breakdown": rule.subject_breakdown,
        },
        "ai_inference": {
            "analysis":    ai_text,
            "is_fallback": is_fallback,
        },
        "combined_prediction": combined,
        "is_fallback": is_fallback,
    }

    if not is_fallback:
        cache.set(cache_key, result)

    response.headers["X-Cache"] = "MISS"
    response.headers["X-Cache-Stats"] = str(CacheStats.summary())
    if is_fallback:
        response.headers["X-Fallback"] = "true"

    rank_resp = RankResponse(cache_hit=False, **result)

    if download and download.lower() == "pdf":
        return _pdf_response(rank_resp, req.student_id)
    return rank_resp


# ── PDF helper ────────────────────────────────────────────────────────────────

def _pdf_response(rank_resp: RankResponse, student_id: str) -> StreamingResponse:
    pdf_bytes = build_rank_pdf(rank_resp.model_dump())
    filename  = f"rank_prediction_{student_id.replace(' ', '_')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
