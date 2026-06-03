"""
Locust Load Test – Day 16
Target: p95 response time < 2000ms for tutor endpoints.

Usage:
    # Headless mode (automated):
    locust -f tests/locustfile.py --host=http://localhost:8000 \
           --users=50 --spawn-rate=5 --run-time=60s --headless \
           --csv=tests/load_results/report

    # Web UI mode (interactive):
    locust -f tests/locustfile.py --host=http://localhost:8000
    # Open http://localhost:8089

    # Quick smoke test (10 users, 30s):
    locust -f tests/locustfile.py --host=http://localhost:8000 \
           --users=10 --spawn-rate=2 --run-time=30s --headless

Scenarios modelled:
    - MedicalStudent: Heavy tutor usage (explain + ask)
    - ExamPrepUser: MCQ generation focused
    - ClinicalTrainer: Patient simulation sessions
    - MixedUser: Realistic mix of all endpoints
"""
from __future__ import annotations

import json
import random
import uuid
import time

# pyrefly: ignore [missing-import]
from locust import HttpUser, TaskSet, task, between, events


# ── Test Data ─────────────────────────────────────────────────────────────────

MEDICAL_TOPICS = [
    "Myocardial Infarction",
    "Type 2 Diabetes Management",
    "Heart Failure",
    "Pneumonia",
    "Acute Kidney Injury",
    "Sepsis",
    "Ischaemic Stroke",
    "Rheumatoid Arthritis",
    "Asthma Management",
    "Beta-blockers pharmacology",
]

MEDICAL_QUESTIONS = [
    "What is the treatment for STEMI?",
    "What are the first-line drugs for heart failure?",
    "How do ACE inhibitors work?",
    "What is the CURB-65 score used for?",
    "What defines AKI?",
    "What are the signs of septic shock?",
    "What is the NIHSS scale?",
    "How do beta-blockers affect heart rate?",
    "What are the complications of diabetes?",
    "When should antibiotics be started in pneumonia?",
]

LEVELS = ["beginner", "intermediate", "advanced"]
DIFFICULTIES = ["easy", "medium", "hard"]
CASE_TYPES = ["chest_pain", "abdominal_pain", "shortness_of_breath"]


# ── Task Sets ─────────────────────────────────────────────────────────────────

class TutorTasks(TaskSet):
    """Tasks focused on tutor endpoints — primary load scenario."""

    @task(3)
    def explain_topic(self):
        """POST /tutor/explain — weighted 3x (most common operation)."""
        payload = {
            "topic": random.choice(MEDICAL_TOPICS),
            "level": random.choice(LEVELS),
            "context": "",
        }
        with self.client.post(
            "/tutor/explain",
            json=payload,
            catch_response=True,
            name="/tutor/explain",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if len(data.get("explanation", "")) < 50:
                    resp.failure("Explanation too short (< 50 chars)")
                else:
                    resp.success()
            else:
                resp.failure(f"HTTP {resp.status_code}")

    @task(2)
    def ask_question(self):
        """POST /tutor/ask — weighted 2x (RAG retrieval)."""
        payload = {
            "question": random.choice(MEDICAL_QUESTIONS),
            "level": random.choice(LEVELS),
            "top_k": random.randint(2, 4),
        }
        with self.client.post(
            "/tutor/ask",
            json=payload,
            catch_response=True,
            name="/tutor/ask",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if len(data.get("answer", "")) < 50:
                    resp.failure("Answer too short (< 50 chars)")
                else:
                    resp.success()
            else:
                resp.failure(f"HTTP {resp.status_code}")

    @task(1)
    def check_health(self):
        """GET /health — lightweight probe, 1x weight."""
        with self.client.get(
            "/health",
            catch_response=True,
            name="/health",
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"HTTP {resp.status_code}")


class MCQTasks(TaskSet):
    """Tasks focused on MCQ generation."""

    @task(3)
    def generate_mcq(self):
        """POST /generate-mcq — main MCQ scenario."""
        payload = {
            "topic": random.choice(MEDICAL_TOPICS),
            "num_questions": random.randint(2, 5),
            "difficulty": random.choice(DIFFICULTIES),
        }
        with self.client.post(
            "/generate-mcq",
            json=payload,
            catch_response=True,
            name="/generate-mcq",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if len(data.get("questions", [])) == 0:
                    resp.failure("No questions generated")
                else:
                    resp.success()
            else:
                resp.failure(f"HTTP {resp.status_code}")

    @task(1)
    def check_cache_stats(self):
        """GET /cache/stats — lightweight."""
        self.client.get("/cache/stats", name="/cache/stats")


class PatientSimTasks(TaskSet):
    """Tasks for patient simulation sessions."""

    def on_start(self):
        """Each simulated user gets a unique session ID."""
        self.session_id = f"load_test_{uuid.uuid4().hex[:8]}"
        self.message_count = 0

    @task(2)
    def simulate_patient(self):
        """POST /simulate-patient — start or continue a session."""
        messages = [
            "Good morning, I am Dr. Smith. What brings you in today?",
            "How long have you had this pain?",
            "Does the pain radiate anywhere?",
            "Any nausea or shortness of breath?",
            "Are you on any medications?",
        ]
        payload = {
            "session_id": self.session_id,
            "user_message": messages[self.message_count % len(messages)],
            "case_type": random.choice(CASE_TYPES),
        }
        self.message_count += 1

        with self.client.post(
            "/simulate-patient",
            json=payload,
            catch_response=True,
            name="/simulate-patient",
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if len(data.get("patient_response", "")) < 10:
                    resp.failure("Patient response too short")
                else:
                    resp.success()
            else:
                resp.failure(f"HTTP {resp.status_code}")


class IngestTasks(TaskSet):
    """Tasks for document ingestion — lighter weight."""

    @task(1)
    def check_ingest_stats(self):
        """GET /ingest/stats — lightweight status check."""
        self.client.get("/ingest/stats", name="/ingest/stats")

    @task(1)
    def ingest_small_text(self):
        """POST /ingest/text — ingest a small test document."""
        payload = {
            "text": (
                f"Load test document {random.randint(1, 1000)}. "
                "Hypertension is a chronic condition characterised by elevated blood pressure "
                "above 140/90 mmHg. It is a major risk factor for cardiovascular disease, "
                "stroke, and chronic kidney disease. First-line treatment includes lifestyle "
                "modifications and ACE inhibitors or ARBs."
            ),
            "topic": random.choice(["cardiology", "pharmacology", "general"]),
            "source": f"load_test_{random.randint(1, 100)}.txt",
        }
        with self.client.post(
            "/ingest/text",
            json=payload,
            catch_response=True,
            name="/ingest/text",
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"HTTP {resp.status_code}")


# ── User Classes ──────────────────────────────────────────────────────────────

class MedicalStudent(HttpUser):
    """
    Primary user type: heavy tutor usage.
    Simulates a medical student studying for exams.
    Weight: 40% of users.
    """
    weight = 4
    wait_time = between(1, 3)
    tasks = [TutorTasks]


class ExamPrepUser(HttpUser):
    """
    MCQ-focused user: generating practice questions.
    Weight: 30% of users.
    """
    weight = 3
    wait_time = between(2, 5)
    tasks = [MCQTasks]


class ClinicalTrainer(HttpUser):
    """
    Patient simulation user: practicing clinical encounters.
    Weight: 20% of users.
    """
    weight = 2
    wait_time = between(3, 8)
    tasks = [PatientSimTasks]


class ContentIngester(HttpUser):
    """
    Admin-type user: uploading study materials.
    Weight: 10% of users.
    """
    weight = 1
    wait_time = between(5, 15)
    tasks = [IngestTasks]


# ── P95 Assertion Hook ────────────────────────────────────────────────────────

P95_THRESHOLD_MS = 2000  # Target: 2 seconds
TUTOR_ENDPOINTS = ["/tutor/explain", "/tutor/ask"]

# Track per-endpoint response times for P95 calculation
_response_times: dict[str, list[float]] = {}


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, **kwargs):
    """Track response times per endpoint for P95 analysis."""
    if name not in _response_times:
        _response_times[name] = []
    _response_times[name].append(response_time)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Print P95 summary at end of load test."""
    print("\n" + "="*60)
    print("  LOAD TEST P95 RESULTS -- Day 16")
    print("="*60)

    all_pass = True
    for endpoint in sorted(_response_times.keys()):
        times = sorted(_response_times[endpoint])
        if not times:
            continue
        p50 = times[int(len(times) * 0.50)]
        p95 = times[int(len(times) * 0.95)]
        p99 = times[int(len(times) * 0.99)] if len(times) > 10 else times[-1]

        is_tutor = endpoint in TUTOR_ENDPOINTS
        pass_fail = ""
        if is_tutor:
            if p95 <= P95_THRESHOLD_MS:
                pass_fail = f"[PASS] p95 {p95:.0f}ms < {P95_THRESHOLD_MS}ms"
            else:
                pass_fail = f"[FAIL] p95 {p95:.0f}ms > {P95_THRESHOLD_MS}ms"
                all_pass = False

        print(f"\n  {endpoint}")
        print(f"    Requests : {len(times)}")
        print(f"    p50      : {p50:.0f}ms")
        print(f"    p95      : {p95:.0f}ms  {pass_fail}")
        print(f"    p99      : {p99:.0f}ms")

    print("\n" + "="*60)
    if all_pass:
        print("  [OK] ALL TUTOR ENDPOINTS: p95 < 2000ms -- PASS")
    else:
        print("  [!!] SOME ENDPOINTS EXCEEDED p95 TARGET (Groq rate limit is likely cause)")
    print("="*60 + "\n")
