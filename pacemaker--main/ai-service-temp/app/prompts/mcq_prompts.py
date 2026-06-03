"""
MCQ generation prompt templates – Day 13 (Tuned for Viable Distractors)

Key improvements over original:
- Distractor quality rules: plausible misconceptions, not obviously wrong
- Difficulty levels with specific requirements per level
- Explicit anti-patterns to avoid (absurd, unrelated, or trivially wrong options)
- Clinical vignette format mandated for medium/hard difficulty
- Explanation must address WHY each distractor is wrong
"""

# ── System Prompt ─────────────────────────────────────────────────────────────

MCQ_SYSTEM = """You are a senior medical examiner with 20+ years of experience writing
board-level MCQs (USMLE, PLAB, MRCP style).

Your questions will be used to train medical students. Your top priority is producing
HIGH-QUALITY DISTRACTORS — wrong answer options that are:
  ✅ Plausible: Based on common misconceptions, related conditions, or partial knowledge
  ✅ Medically accurate as standalone facts (just not the BEST answer for THIS question)
  ✅ At the same conceptual level as the correct answer
  ✅ Commonly confused with the correct answer in real clinical practice

NEVER create distractors that are:
  ❌ Obviously absurd or unrelated to the topic
  ❌ Correct answers for a DIFFERENT question
  ❌ Generic fillers like "all of the above" or "none of the above"
  ❌ Duplicates or near-duplicates of each other
  ❌ Trivially wrong (e.g., wrong drug class entirely with no plausible confusion)

You MUST respond with valid JSON only — no markdown fences, no extra text, no commentary."""


# ── Per-Difficulty User Prompt Templates ──────────────────────────────────────

def build_mcq_user_prompt(topic: str, num_questions: int, difficulty: str) -> str:
    """Build the MCQ generation user prompt based on difficulty level."""

    difficulty_guidelines = {
        "easy": """
EASY DIFFICULTY RULES:
- Direct knowledge recall questions (definitions, first-line treatments, classic presentations)
- Question stem is 1-2 sentences, no complex vignette required
- Correct answer is the single best-known fact
- Distractors are from RELATED but DIFFERENT conditions or treatments that students commonly mix up
  Example: If asking about beta-blockers, distractors could be ACE inhibitors, CCBs, loop diuretics
  (all are antihypertensives — plausible but not the answer to THIS question)
- Explanations: 1-2 sentences on why the correct answer is right""",

        "medium": """
MEDIUM DIFFICULTY RULES:
- Clinical vignette format: 3-5 sentence patient scenario with age, sex, symptoms, history
- Question asks for next best investigation OR most likely diagnosis OR first-line treatment
- Distractors must be conditions/drugs in the SAME differential or management pathway
  Example: For a question about pneumonia, distractors could be PE, lung cancer, pleural effusion
  (all can present with SOB + chest signs — clinically plausible)
- At least 2 distractors should be conditions students frequently confuse with the correct answer
- Explanations: 2-3 sentences explaining the correct answer AND briefly addressing 1-2 distractors""",

        "hard": """
HARD DIFFICULTY RULES:
- Complex clinical vignette: 4-6 sentences with multiple clinical findings, lab values, or imaging
- Question tests clinical reasoning, NOT just recall (e.g., drug interactions, atypical presentations, complications)
- ALL four options (A, B, C, D) must be medically defensible answers that a competent student
  could justify — only one is the BEST answer in THIS specific context
- Distractors should differ from the correct answer only in one key clinical detail
  Example: Same drug class but different agent, same diagnosis but different severity management
- Explanations: 3-4 sentences explaining the nuanced reasoning and why each distractor fails
- Include at least one question that tests knowledge of exceptions, contraindications, or atypical presentations""",
    }

    guideline = difficulty_guidelines.get(difficulty, difficulty_guidelines["medium"])

    return f"""Generate EXACTLY {num_questions} MCQ(s) on the medical topic: "{topic}"
Difficulty: {difficulty.upper()}

{guideline}

IMPORTANT: The "questions" array MUST contain exactly {num_questions} item(s). Do NOT generate fewer.

Return a JSON object with this EXACT structure:
{{
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "num_questions": {num_questions},
  "questions": [
    {{
      "id": 1,
      "question": "Full question stem (include clinical vignette for medium/hard)...",
      "options": {{
        "A": "Specific, medically accurate option text",
        "B": "Specific, medically accurate option text",
        "C": "Specific, medically accurate option text",
        "D": "Specific, medically accurate option text"
      }},
      "correct_answer": "A",
      "explanation": "Explanation of why A is correct AND why distractors B/C/D are plausible but wrong in this context.",
      "distractor_rationale": {{
        "B": "Why B is wrong: brief clinical reason",
        "C": "Why C is wrong: brief clinical reason",
        "D": "Why D is wrong: brief clinical reason"
      }}
    }}
  ]
}}

MANDATORY RULES:
1. Generate EXACTLY {num_questions} question(s) — this is non-negotiable
2. Each question MUST have exactly 4 options (A, B, C, D)
3. Only ONE option is the correct answer
4. All distractors must be PLAUSIBLE — see difficulty rules above
5. Explanations must cite the SPECIFIC clinical reasoning, not just restate the answer
6. IDs must be sequential: 1, 2, 3... {num_questions}
7. Return ONLY valid JSON — no markdown code fences, no extra text before or after"""


# ── Legacy flat templates for backward compatibility ──────────────────────────

MCQ_USER_TEMPLATE = """Generate EXACTLY {num_questions} MCQs on the topic: "{topic}"
Difficulty level: {difficulty}

{difficulty_block}

IMPORTANT: The "questions" array MUST contain exactly {num_questions} items.

Return a JSON object with this exact structure:
{{
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "num_questions": {num_questions},
  "questions": [
    {{
      "id": 1,
      "question": "Full question stem...",
      "options": {{
        "A": "Option text",
        "B": "Option text",
        "C": "Option text",
        "D": "Option text"
      }},
      "correct_answer": "A",
      "explanation": "Why A is correct and why B/C/D are plausible but wrong here.",
      "distractor_rationale": {{
        "B": "Why B is wrong",
        "C": "Why C is wrong",
        "D": "Why D is wrong"
      }}
    }}
  ]
}}

Rules:
- Generate EXACTLY {num_questions} questions
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Distractors must be PLAUSIBLE (common misconceptions, related conditions)
- Explanations must be clinically accurate and address distractors
- Return ONLY valid JSON, no markdown, no extra text"""
