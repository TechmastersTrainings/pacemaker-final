"""
Patient simulation router – Task 5
POST /simulate-patient → multi-turn patient roleplay with Redis chat history
"""
import io
import logging
from typing import Optional

from fastapi import APIRouter, Response, Query, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.groq_client import get_groq_client
from app.cache import get_cache, CacheStats
from app.prompts.patient_prompts import PATIENT_SYSTEM_TEMPLATE, CASE_PROFILES
from app.pdf_generator import build_patient_pdf
from app.fallback_responses import PATIENT_FALLBACK_RESPONSE

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Patient Simulator"])

AVAILABLE_CASES = list(CASE_PROFILES.keys())


# ── Models ────────────────────────────────────────────────────────────────────

class PatientRequest(BaseModel):
    session_id: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Unique session ID (UUID recommended)",
        examples=["student-001-session-abc"],
    )
    user_message: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="What the student says to the patient",
    )
    case_type: Optional[str] = Field(
        default="chest_pain",
        description=f"Patient case scenario. Options: {AVAILABLE_CASES}",
    )
    custom_case_profile: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Override with a custom patient profile (optional)",
    )
    reset_session: bool = Field(
        default=False,
        description="If True, clears chat history for this session",
    )


class PatientResponse(BaseModel):
    session_id: str
    patient_response: str
    case_type: str
    turn_count: int
    is_fallback: bool
    cache_hit: bool


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post(
    "/simulate-patient",
    response_model=None,
    summary="Interact with an AI patient simulation",
)
async def simulate_patient(
    req: PatientRequest,
    response: Response,
    download: Optional[str] = Query(default=None, description="Set to 'pdf' to download response as PDF"),
):
    """
    **Task 5** – Multi-turn patient simulation chatbot.
    - Chat history is stored in Redis per `session_id`
    - System prompt sets the patient profile and roleplay rules
    - AI responses are cached; cache key is SHA-256 of full message history
    - Set `reset_session=True` to start a new encounter
    """
    client = get_groq_client()
    cache = get_cache()

    # Validate case type
    case_type = req.case_type or "chest_pain"
    if case_type not in CASE_PROFILES and not req.custom_case_profile:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown case_type '{case_type}'. Available: {AVAILABLE_CASES}",
        )

    # Resolve case profile
    case_profile = req.custom_case_profile or CASE_PROFILES[case_type]
    system_prompt = PATIENT_SYSTEM_TEMPLATE.format(case_profile=case_profile)

    # Load or reset session history
    if req.reset_session:
        session_messages: list = []
        logger.info("Session %s reset.", req.session_id)
    else:
        session_messages = cache.get_session(req.session_id)

    # Append new user message
    session_messages.append({"role": "user", "content": req.user_message})

    # Build full message list for Groq
    messages = [{"role": "system", "content": system_prompt}] + session_messages

    # Cache key based on full conversation hash
    conv_hash = client.make_cache_key(str(messages))
    cached = cache.get(conv_hash)
    if cached and not req.reset_session:
        # Restore session from cache hit scenario
        cache.store_session(req.session_id, session_messages)
        response.headers["X-Cache"] = "HIT"
        response.headers["X-Cache-Stats"] = str(CacheStats.summary())
        patient_resp = PatientResponse(
            session_id=req.session_id,
            case_type=case_type,
            turn_count=len([m for m in session_messages if m["role"] == "user"]),
            is_fallback=False,
            cache_hit=True,
            patient_response=cached["patient_response"],
        )
        if download and download.lower() == "pdf":
            pdf_bytes = build_patient_pdf(patient_resp.model_dump())
            return StreamingResponse(
                io.BytesIO(pdf_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="patient_{req.session_id}.pdf"'},
            )
        return patient_resp

    # Call Groq – pass rich in-character fallback if AI is unavailable
    content, is_fallback = client.complete(
        messages=messages,
        temperature=0.8,  # Slightly higher for natural patient responses
        fallback=PATIENT_FALLBACK_RESPONSE,
    )

    if is_fallback:
        logger.warning(
            "[/simulate-patient] Groq unavailable – serving static fallback for session '%s'",
            req.session_id,
        )
        # Preserve session so history is intact when service recovers
        cache.store_session(req.session_id, session_messages)
        response.headers["X-Cache"] = "MISS"
        response.headers["X-Fallback"] = "true"
        patient_resp = PatientResponse(
            session_id=req.session_id,
            case_type=case_type,
            turn_count=len([m for m in session_messages if m["role"] == "user"]),
            is_fallback=True,
            cache_hit=False,
            patient_response=content,
        )
        if download and download.lower() == "pdf":
            pdf_bytes = build_patient_pdf(patient_resp.model_dump())
            return StreamingResponse(
                io.BytesIO(pdf_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="patient_{req.session_id}.pdf"'},
            )
        return patient_resp

    # Store assistant reply in history
    session_messages.append({"role": "assistant", "content": content})
    cache.store_session(req.session_id, session_messages)

    # Cache this response
    cache.set(conv_hash, {"patient_response": content})

    response.headers["X-Cache"] = "MISS"
    response.headers["X-Cache-Stats"] = str(CacheStats.summary())
    patient_resp = PatientResponse(
        session_id=req.session_id,
        case_type=case_type,
        turn_count=len([m for m in session_messages if m["role"] == "user"]),
        is_fallback=False,
        cache_hit=False,
        patient_response=content,
    )
    if download and download.lower() == "pdf":
        pdf_bytes = build_patient_pdf(patient_resp.model_dump())
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="patient_{req.session_id}.pdf"'},
        )
    return patient_resp


@router.get(
    "/simulate-patient/cases",
    summary="List available patient cases",
)
async def list_cases():
    """Return the list of built-in patient case scenarios."""
    return {
        "available_cases": AVAILABLE_CASES,
        "descriptions": {
            "chest_pain": "52yo male with STEMI presentation",
            "abdominal_pain": "28yo female with RLQ pain (ectopic/appendicitis)",
            "shortness_of_breath": "68yo male with decompensated heart failure",
        },
    }
