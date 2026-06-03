"""
AI Question Generator router
POST /generate-questions → Structured questions (MCQ, Short Answer, Viva, Clinical Discussion)
"""
import io
import json
import logging
from typing import Literal, Optional, List, Dict, Any

from fastapi import APIRouter, Response, Query, HTTPException
from pydantic import BaseModel, Field

from app.groq_client import get_groq_client
from app.cache import get_cache, CacheStats

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Question Generator"])

QuestionType = Literal["mcq", "short_answer", "viva", "discussion"]
DifficultyType = Literal["easy", "medium", "hard", "exam-level"]

# ── Prompts ───────────────────────────────────────────────────────────────────

QUESTION_GENERATOR_SYSTEM = """You are a senior medical examiner with 20+ years of experience writing board-level medical questions (USMLE, PLAB, MRCP, and medical school viva/theory exams).

You generate questions in four distinct formats depending on what is requested:
1. MCQ (Multiple Choice Questions):
   - A clinical scenario or direct question.
   - Four options: A, B, C, D. All must be plausible, at the same conceptual level.
   - correct_answer: The letter "A", "B", "C", or "D".
   - explanation: Detailed reason why the correct option is right and others are wrong.
2. SHORT_ANSWER (Short Text / Theory):
   - A clinical theory question or explanation-based question.
   - correct_answer: The comprehensive correct answer.
   - explanation: Key concepts, grading rubrics, or high-yield details.
3. VIVA (Oral Questions):
   - An oral exam style question designed to test clinical reasoning.
   - correct_answer: The expected verbal response from the student.
   - explanation: Clinical pearls, follow-up questions the examiner might ask.
4. CLINICAL_DISCUSSION:
   - A complex clinical case study or discussion prompt.
   - correct_answer: The optimal clinical approach or differential diagnosis.
   - explanation: Discussion points, pathophysiology, and management guidelines.

You MUST respond with valid JSON only — no markdown fences, no extra text, no commentary."""

def build_questions_user_prompt(prompt: str, question_type: str, num_questions: int, difficulty: str) -> str:
    return f"""Based on the request: "{prompt}"
Generate EXACTLY {num_questions} medical question(s) of type "{question_type.upper()}" at difficulty level "{difficulty.upper()}".

If the user's request contains specific keywords specifying a different format (like 'viva', 'short text', 'discussion', or 'mcq'), prioritize the format specified in their text.

Return a JSON object with this EXACT structure:
{{
  "topic": "Extracted main medical topic",
  "difficulty": "{difficulty.lower()}",
  "num_questions": {num_questions},
  "question_type": "{question_type.lower()}",
  "questions": [
    {{
      "id": 1,
      "type": "mcq",
      "question": "Full question/vignette text...",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "correct_answer": "A",
      "explanation": "Detailed explanation, discussion points, or clinical pearls."
    }}
  ]
}}

MANDATORY RULES:
1. Generate EXACTLY {num_questions} questions.
2. For MCQ: each must have exactly 4 options (A, B, C, D) and a single letter correct_answer.
3. For SHORT_ANSWER, VIVA, and CLINICAL_DISCUSSION: the "options" field MUST be null, and "correct_answer" must contain the complete answer text.
4. Return ONLY valid JSON – no markdown blocks, no text before or after."""


# ── Models ────────────────────────────────────────────────────────────────────

class QuestionGeneratorRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=500, examples=["5 mcqs on stomach pain"])
    question_type: QuestionType = Field(default="mcq")
    num_questions: int = Field(default=5, ge=1, le=15)
    difficulty: DifficultyType = Field(default="medium")


class MCQOption(BaseModel):
    A: str
    B: str
    C: str
    D: str


class GeneratedQuestion(BaseModel):
    id: int
    type: str
    question: str
    options: Optional[MCQOption] = None
    correct_answer: str
    explanation: str


class QuestionGeneratorResponse(BaseModel):
    topic: str
    difficulty: str
    num_questions: int
    question_type: str
    questions: list[GeneratedQuestion]
    is_fallback: bool
    cache_hit: bool


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post(
    "/generate-questions",
    response_model=QuestionGeneratorResponse,
    summary="Generate medical questions (MCQ, Short Answer, Viva, Clinical Discussion)",
)
async def generate_questions(req: QuestionGeneratorRequest, response: Response):
    """
    Generate questions of various types using Groq LLaMA model.
    Responses are Redis-cached for 15 minutes.
    """
    client = get_groq_client()
    cache = get_cache()

    user_prompt = build_questions_user_prompt(
        prompt=req.prompt,
        question_type=req.question_type,
        num_questions=req.num_questions,
        difficulty=req.difficulty,
    )
    cache_key = client.make_cache_key(f"questions:{user_prompt}")

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        response.headers["X-Cache"] = "HIT"
        response.headers["X-Cache-Stats"] = str(CacheStats.summary())
        return QuestionGeneratorResponse(cache_hit=True, **cached)

    # Call Groq
    raw, is_fallback = client.system_user(
        system_prompt=QUESTION_GENERATOR_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.3,
        max_tokens=3000,
    )

    if is_fallback:
        logger.warning("[/generate-questions] Groq unavailable – serving static fallback")
        # Direct basic fallback mapping
        fallback_result = {
            "topic": "General Medicine",
            "difficulty": req.difficulty,
            "num_questions": 1,
            "question_type": req.question_type,
            "questions": [
                {
                    "id": 1,
                    "type": req.question_type,
                    "question": f"Please describe the primary clinical features of appendicitis (Fallback answer to request: {req.prompt}).",
                    "options": {
                        "A": "Right lower quadrant pain",
                        "B": "Left upper quadrant pain",
                        "C": "Headache",
                        "D": "Rash"
                    } if req.question_type == "mcq" else None,
                    "correct_answer": "A" if req.question_type == "mcq" else "Right lower quadrant pain starting periumbilically, fever, nausea, anorexia, and localized tenderness at McBurney's point.",
                    "explanation": "Appendicitis typically presents with acute abdominal pain starting around the umbilicus and shifting to the right lower quadrant, accompanied by signs of localized peritoneal inflammation."
                }
            ],
            "is_fallback": True,
        }
        response.headers["X-Cache"] = "MISS"
        response.headers["X-Fallback"] = "true"
        return QuestionGeneratorResponse(cache_hit=False, **fallback_result)

    # Parse JSON response
    try:
        clean = raw.strip()
        if clean.startswith("```"):
            clean = "\n".join(clean.split("\n")[1:])
        if clean.endswith("```"):
            clean = "\n".join(clean.split("\n")[:-1])
        parsed = json.loads(clean)
    except json.JSONDecodeError as exc:
        logger.error("Question Gen JSON parse error: %s\nRaw: %s", exc, raw[:500])
        raise HTTPException(
            status_code=422,
            detail=f"AI returned malformed JSON. Please retry. Error: {str(exc)}",
        )

    # Standardize types and formats in response
    questions_list = parsed.get("questions", [])
    for q in questions_list:
        if "type" not in q or not q["type"]:
            q["type"] = parsed.get("question_type", req.question_type)
        if q["type"] != "mcq":
            q["options"] = None

    result = {
        "topic": parsed.get("topic", "Medical Topic"),
        "difficulty": parsed.get("difficulty", req.difficulty),
        "num_questions": len(questions_list),
        "question_type": parsed.get("question_type", req.question_type),
        "questions": questions_list,
        "is_fallback": False,
    }
    
    cache.set(cache_key, result)

    response.headers["X-Cache"] = "MISS"
    response.headers["X-Cache-Stats"] = str(CacheStats.summary())
    return QuestionGeneratorResponse(cache_hit=False, **result)
