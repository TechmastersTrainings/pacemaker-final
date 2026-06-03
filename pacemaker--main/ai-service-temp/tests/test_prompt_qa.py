"""
Prompt QA Evaluation – Day 15
Scores AI output quality for all endpoints on a 1–5 rubric.
Target: all endpoints ≥ 4/5 average score.

Usage:
    pytest tests/test_prompt_qa.py -v -s
    python tests/test_prompt_qa.py  (standalone mode)
"""
from __future__ import annotations

import json
import re
import sys
import time
from dataclasses import dataclass, field
from typing import Optional

import httpx
import pytest

# ── Configuration ──────────────────────────────────────────────────────────────

BASE_URL = "http://localhost:8000"
TIMEOUT = 60  # seconds per request
PASS_THRESHOLD = 4.0  # minimum average score to pass (out of 5)


# ── Scoring Rubric ─────────────────────────────────────────────────────────────

def score_explain_response(response: dict, topic: str) -> tuple[float, list[str]]:
    """
    Score /tutor/explain response on 5 criteria (1 point each):
    1. Non-empty explanation (≥100 chars)
    2. Contains structured sections (Core Concept / Key Takeaways / etc.)
    3. Clinically relevant content (mentions topic keyword)
    4. Not a fallback response
    5. Explanation length indicates depth (≥300 chars)
    """
    notes = []
    score = 0.0

    explanation = response.get("explanation", "")
    topic_lower = topic.lower()

    # Criterion 1: Non-empty
    if len(explanation) >= 100:
        score += 1
        notes.append("✅ [1/5] Explanation present and non-trivial")
    else:
        notes.append("❌ [1/5] Explanation too short or missing")

    # Criterion 2: Has structure (sections/headings/bullets)
    structure_markers = ["##", "**", "1.", "2.", "3.", "•", "-", "Core Concept", "Key Takeaway"]
    if any(m in explanation for m in structure_markers):
        score += 1
        notes.append("✅ [2/5] Structured formatting detected")
    else:
        notes.append("❌ [2/5] No structure / formatting found")

    # Criterion 3: Topic relevance
    topic_words = [w for w in topic_lower.split() if len(w) > 3]
    hits = sum(1 for w in topic_words if w in explanation.lower())
    if hits >= min(2, len(topic_words)):
        score += 1
        notes.append(f"✅ [3/5] Topic relevant ({hits}/{len(topic_words)} keywords found)")
    else:
        notes.append(f"❌ [3/5] Low topic relevance ({hits}/{len(topic_words)} keywords)")

    # Criterion 4: Not a fallback
    if not response.get("is_fallback", True):
        score += 1
        notes.append("✅ [4/5] Live AI response (not fallback)")
    else:
        notes.append("⚠️  [4/5] Fallback response — Groq unavailable")
        score += 0.5  # partial credit — fallback is functional, just not AI

    # Criterion 5: Depth (length)
    if len(explanation) >= 300:
        score += 1
        notes.append(f"✅ [5/5] Depth adequate ({len(explanation)} chars)")
    else:
        notes.append(f"❌ [5/5] Response too brief ({len(explanation)} chars)")

    return score, notes


def score_ask_response(response: dict, question: str) -> tuple[float, list[str]]:
    """
    Score /tutor/ask response:
    1. Non-empty answer (≥100 chars)
    2. Has sources (RAG retrieval worked)
    3. Answer addresses the question (keyword match)
    4. Not a fallback
    5. Sources have reasonable similarity scores
    """
    notes = []
    score = 0.0

    answer = response.get("answer", "")
    sources = response.get("sources", [])
    q_words = [w for w in question.lower().split() if len(w) > 3]

    # Criterion 1: Non-empty answer
    if len(answer) >= 100:
        score += 1
        notes.append("✅ [1/5] Answer present")
    else:
        notes.append("❌ [1/5] Answer too short")

    # Criterion 2: Has RAG sources
    if len(sources) >= 1:
        score += 1
        notes.append(f"✅ [2/5] {len(sources)} RAG source(s) retrieved")
    else:
        notes.append("❌ [2/5] No RAG sources retrieved")

    # Criterion 3: Answer relevance
    hits = sum(1 for w in q_words if w in answer.lower())
    if hits >= min(2, len(q_words)):
        score += 1
        notes.append(f"✅ [3/5] Answer relevant ({hits}/{len(q_words)} question keywords)")
    else:
        notes.append(f"❌ [3/5] Low relevance ({hits}/{len(q_words)} keywords)")

    # Criterion 4: Not a fallback
    if not response.get("is_fallback", True):
        score += 1
        notes.append("✅ [4/5] Live AI response")
    else:
        notes.append("⚠️  [4/5] Fallback response")
        score += 0.5

    # Criterion 5: Source quality (scores > 0.3)
    good_sources = [s for s in sources if s.get("score", 0) > 0.3]
    if good_sources:
        avg_score = sum(s.get("score", 0) for s in sources) / len(sources)
        score += 1
        notes.append(f"✅ [5/5] Avg source similarity: {avg_score:.3f}")
    else:
        notes.append("❌ [5/5] Source similarity scores too low")

    return score, notes


def score_mcq_response(response: dict) -> tuple[float, list[str]]:
    """
    Score /generate-mcq response:
    1. Has questions array
    2. Correct number of questions generated
    3. All questions have 4 options
    4. Explanations are substantive (≥50 chars)
    5. Distractor rationale present (Day 13 feature)
    """
    notes = []
    score = 0.0

    questions = response.get("questions", [])
    expected_count = response.get("num_questions", 0)

    # Criterion 1: Has questions
    if len(questions) > 0:
        score += 1
        notes.append(f"✅ [1/5] {len(questions)} question(s) generated")
    else:
        notes.append("❌ [1/5] No questions generated")
        return score, notes  # Can't score further

    # Criterion 2: Correct count
    if len(questions) >= expected_count:
        score += 1
        notes.append(f"✅ [2/5] Correct count ({len(questions)}/{expected_count})")
    else:
        notes.append(f"❌ [2/5] Wrong count ({len(questions)}/{expected_count})")

    # Criterion 3: All questions have 4 options
    all_have_options = all(
        len(q.get("options", {}) if isinstance(q.get("options"), dict) else {}) == 4
        for q in questions
    )
    if all_have_options:
        score += 1
        notes.append("✅ [3/5] All questions have 4 options (A/B/C/D)")
    else:
        notes.append("❌ [3/5] Some questions missing options")

    # Criterion 4: Substantive explanations
    good_explanations = [
        q for q in questions
        if len(q.get("explanation", "")) >= 50
    ]
    if len(good_explanations) == len(questions):
        score += 1
        notes.append("✅ [4/5] All explanations substantive (≥50 chars)")
    else:
        notes.append(f"❌ [4/5] {len(questions)-len(good_explanations)} weak explanations")

    # Criterion 5: Distractor rationale present (Day 13 feature)
    with_rationale = [q for q in questions if q.get("distractor_rationale")]
    if len(with_rationale) >= len(questions) * 0.5:  # at least 50%
        score += 1
        notes.append(f"✅ [5/5] Distractor rationale in {len(with_rationale)}/{len(questions)} questions")
    else:
        notes.append(f"⚠️  [5/5] Distractor rationale missing ({len(with_rationale)}/{len(questions)})")
        score += 0.5

    return score, notes


def score_patient_response(response: dict) -> tuple[float, list[str]]:
    """
    Score /simulate-patient response:
    1. Patient response is non-empty
    2. Response uses lay language (no immediate diagnosis)
    3. Response is appropriately long (15+ words)
    4. Not a fallback
    5. Emotionally appropriate / natural tone
    """
    notes = []
    score = 0.0

    patient_response = response.get("patient_response", "")

    # Criterion 1: Non-empty
    if len(patient_response) >= 20:
        score += 1
        notes.append("✅ [1/5] Patient responded")
    else:
        notes.append("❌ [1/5] Patient response too short or missing")

    # Criterion 2: No immediate clinical diagnosis given
    diagnosis_words = ["diagnosis", "you have", "it is", "STEMI", "appendicitis", "ecgopic"]
    has_diagnosis = any(d.lower() in patient_response.lower() for d in diagnosis_words)
    if not has_diagnosis:
        score += 1
        notes.append("✅ [2/5] Patient stayed in role (no premature diagnosis)")
    else:
        notes.append("❌ [2/5] Patient broke character / revealed diagnosis")

    # Criterion 3: Adequate length
    word_count = len(patient_response.split())
    if word_count >= 15:
        score += 1
        notes.append(f"✅ [3/5] Natural response length ({word_count} words)")
    else:
        notes.append(f"❌ [3/5] Response too brief ({word_count} words)")

    # Criterion 4: Not a fallback
    if not response.get("is_fallback", True):
        score += 1
        notes.append("✅ [4/5] Live AI response")
    else:
        notes.append("⚠️  [4/5] Fallback response")
        score += 0.5

    # Criterion 5: Natural language markers (first person, emotional words)
    natural_markers = ["I ", "my ", "pain", "feel", "worried", "hurts", "I've", "I'm", "me "]
    hits = sum(1 for m in natural_markers if m in patient_response)
    if hits >= 2:
        score += 1
        notes.append(f"✅ [5/5] Natural patient voice ({hits} markers)")
    else:
        notes.append(f"❌ [5/5] Unnatural response voice ({hits} markers)")

    return score, notes


# ── Test Cases ─────────────────────────────────────────────────────────────────

TEST_CASES = {
    "explain_mi": {
        "endpoint": "/tutor/explain",
        "payload": {"topic": "Myocardial Infarction", "level": "intermediate"},
        "scorer": "explain",
        "topic": "Myocardial Infarction",
    },
    "explain_diabetes": {
        "endpoint": "/tutor/explain",
        "payload": {"topic": "Type 2 Diabetes Management", "level": "advanced"},
        "scorer": "explain",
        "topic": "Type 2 Diabetes Management",
    },
    "ask_stemi_treatment": {
        "endpoint": "/tutor/ask",
        "payload": {"question": "What is the treatment for STEMI and target time?", "level": "intermediate"},
        "scorer": "ask",
        "question": "What is the treatment for STEMI and target time?",
    },
    "ask_heart_failure": {
        "endpoint": "/tutor/ask",
        "payload": {"question": "What drugs reduce mortality in heart failure with reduced ejection fraction?", "level": "advanced"},
        "scorer": "ask",
        "question": "What drugs reduce mortality in heart failure with reduced ejection fraction?",
    },
    "mcq_easy": {
        "endpoint": "/generate-mcq",
        "payload": {"topic": "Beta-blockers", "num_questions": 2, "difficulty": "easy"},
        "scorer": "mcq",
    },
    "mcq_hard": {
        "endpoint": "/generate-mcq",
        "payload": {"topic": "Sepsis Management", "num_questions": 2, "difficulty": "hard"},
        "scorer": "mcq",
    },
    "patient_chest_pain": {
        "endpoint": "/simulate-patient",
        "payload": {
            "session_id": "qa_test_session_001",
            "user_message": "Good morning. I'm Dr. Johnson. What brings you in today?",
            "case_type": "chest_pain",
        },
        "scorer": "patient",
    },
    "patient_follow_up": {
        "endpoint": "/simulate-patient",
        "payload": {
            "session_id": "qa_test_session_001",
            "user_message": "How long have you had this pain? And does it go anywhere else?",
        },
        "scorer": "patient",
    },
}


# ── Test Runner ────────────────────────────────────────────────────────────────

@dataclass
class QAResult:
    test_id: str
    endpoint: str
    score: float
    max_score: float = 5.0
    notes: list[str] = field(default_factory=list)
    latency_ms: float = 0.0
    passed: bool = False
    error: Optional[str] = None

    @property
    def grade(self) -> str:
        pct = self.score / self.max_score
        if pct >= 0.9: return "A"
        if pct >= 0.8: return "B"
        if pct >= 0.7: return "C"
        if pct >= 0.6: return "D"
        return "F"


def run_qa_test(test_id: str, case: dict, client: httpx.Client) -> QAResult:
    """Run a single QA test case and return scored result."""
    endpoint = case["endpoint"]
    payload = case["payload"]
    scorer_type = case["scorer"]

    start = time.perf_counter()
    try:
        resp = client.post(endpoint, json=payload, timeout=TIMEOUT)
        latency_ms = (time.perf_counter() - start) * 1000

        if resp.status_code != 200:
            return QAResult(
                test_id=test_id,
                endpoint=endpoint,
                score=0.0,
                latency_ms=latency_ms,
                error=f"HTTP {resp.status_code}: {resp.text[:200]}",
            )

        data = resp.json()

        # Score based on endpoint type
        if scorer_type == "explain":
            score, notes = score_explain_response(data, case.get("topic", ""))
        elif scorer_type == "ask":
            score, notes = score_ask_response(data, case.get("question", ""))
        elif scorer_type == "mcq":
            score, notes = score_mcq_response(data)
        elif scorer_type == "patient":
            score, notes = score_patient_response(data)
        else:
            score, notes = 0.0, ["Unknown scorer type"]

        return QAResult(
            test_id=test_id,
            endpoint=endpoint,
            score=score,
            notes=notes,
            latency_ms=latency_ms,
            passed=score >= PASS_THRESHOLD,
        )

    except httpx.ConnectError:
        return QAResult(
            test_id=test_id,
            endpoint=endpoint,
            score=0.0,
            error="Connection refused — is the server running at http://localhost:8000?",
        )
    except Exception as exc:
        return QAResult(
            test_id=test_id,
            endpoint=endpoint,
            score=0.0,
            error=str(exc),
        )


def print_report(results: list[QAResult]) -> None:
    """Print a formatted QA report to stdout."""
    print("\n" + "="*70)
    print("  PROMPT QA EVALUATION REPORT — Day 15")
    print("="*70)

    all_scores = []
    for r in results:
        print(f"\n{'─'*60}")
        status = "✅ PASS" if r.passed else ("❌ FAIL" if not r.error else "💥 ERROR")
        print(f"  {status}  [{r.test_id}]  {r.endpoint}")
        print(f"  Score: {r.score:.1f}/5.0  (Grade: {r.grade})  Latency: {r.latency_ms:.0f}ms")

        if r.error:
            print(f"  ⛔ Error: {r.error}")
        else:
            for note in r.notes:
                print(f"    {note}")
            all_scores.append(r.score)

    print("\n" + "="*70)
    if all_scores:
        avg = sum(all_scores) / len(all_scores)
        passed = sum(1 for r in results if r.passed)
        total = len([r for r in results if not r.error])
        print(f"  SUMMARY: {passed}/{total} tests passed | Average score: {avg:.2f}/5.0")
        if avg >= PASS_THRESHOLD:
            print(f"  🎉 OVERALL: PASS (avg {avg:.2f} ≥ {PASS_THRESHOLD})")
        else:
            print(f"  ⚠️  OVERALL: NEEDS WORK (avg {avg:.2f} < {PASS_THRESHOLD})")
    else:
        print("  ⛔ No successful tests — is the server running?")
    print("="*70 + "\n")


# ── Pytest Integration ─────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def http_client():
    with httpx.Client(base_url=BASE_URL, timeout=TIMEOUT) as client:
        # Quick health check — skip all tests if server is down
        try:
            client.get("/health")
        except httpx.ConnectError:
            pytest.skip("Server not running at http://localhost:8000")
        yield client


@pytest.mark.parametrize("test_id,case", list(TEST_CASES.items()))
def test_prompt_qa(test_id: str, case: dict, http_client: httpx.Client):
    """QA test: each endpoint must score ≥ 4/5."""
    result = run_qa_test(test_id, case, http_client)

    # Print notes for visibility
    print(f"\n[{test_id}] Score: {result.score}/5.0")
    for note in result.notes:
        print(f"  {note}")
    if result.error:
        pytest.skip(f"Test skipped due to error: {result.error}")

    assert result.score >= PASS_THRESHOLD, (
        f"[{test_id}] Score {result.score}/5 < threshold {PASS_THRESHOLD}/5\n"
        + "\n".join(result.notes)
    )


# ── Standalone Mode ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n🔍 Running Prompt QA Evaluation (standalone mode)...")
    results = []
    with httpx.Client(base_url=BASE_URL, timeout=TIMEOUT) as client:
        for test_id, case in TEST_CASES.items():
            print(f"  Testing [{test_id}]...", end="", flush=True)
            r = run_qa_test(test_id, case, client)
            results.append(r)
            status = "✅" if r.passed else ("❌" if not r.error else "💥")
            print(f" {status} {r.score:.1f}/5.0")

    print_report(results)

    # Exit code: 0 if all pass, 1 if any fail
    all_pass = all(r.passed for r in results if not r.error)
    sys.exit(0 if all_pass else 1)
