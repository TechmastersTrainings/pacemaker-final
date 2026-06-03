"""
Integration tests for tutor and MCQ endpoints.
Uses TestClient (synchronous) with mocked Groq calls.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.main import app

client = TestClient(app)


class TestHealthEndpoints:
    def test_root(self):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["status"] == "online"

    def test_health(self):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert "model" in data

    def test_cache_stats(self):
        r = client.get("/cache/stats")
        assert r.status_code == 200
        data = r.json()
        assert "cache_hits" in data
        assert "hit_rate_pct" in data


class TestTutorExplain:
    @patch("app.routers.tutor.get_groq_client")
    @patch("app.routers.tutor.get_cache")
    def test_explain_success(self, mock_cache, mock_client):
        # Mock cache miss
        mock_cache.return_value.get.return_value = None
        mock_cache.return_value.set.return_value = True
        # Mock Groq response
        mock_client.return_value.system_user.return_value = ("Explanation text", False)
        mock_client.return_value.make_cache_key.return_value = "abc123"

        r = client.post("/tutor/explain", json={"topic": "Myocardial Infarction"})
        assert r.status_code == 200
        data = r.json()
        assert data["topic"] == "Myocardial Infarction"
        assert data["explanation"] == "Explanation text"
        assert data["is_fallback"] is False

    def test_explain_missing_topic(self):
        r = client.post("/tutor/explain", json={})
        assert r.status_code == 422


class TestTutorAsk:
    @patch("app.routers.tutor.get_groq_client")
    @patch("app.routers.tutor.get_cache")
    @patch("app.routers.tutor.get_optimized_rag")
    def test_ask_success(self, mock_rag, mock_cache, mock_client):
        # Mock RAG retrieval
        from app.rag.optimized_retriever import RAGResult
        mock_rag.return_value.retrieve.return_value = [
            RAGResult("c1", "cardiology", "Some context", 0.9, "knowledge_base")
        ]
        mock_cache.return_value.get.return_value = None
        mock_cache.return_value.set.return_value = True
        mock_client.return_value.system_user.return_value = ("RAG answer", False)
        mock_client.return_value.make_cache_key.return_value = "def456"

        r = client.post("/tutor/ask", json={"question": "What causes MI?"})
        assert r.status_code == 200
        data = r.json()
        assert data["answer"] == "RAG answer"
        assert len(data["sources"]) >= 1


class TestMCQ:
    @patch("app.routers.mcq.get_groq_client")
    @patch("app.routers.mcq.get_cache")
    def test_mcq_success(self, mock_cache, mock_client):
        mock_cache.return_value.get.return_value = None
        mock_cache.return_value.set.return_value = True
        mock_client.return_value.make_cache_key.return_value = "ghi789"

        fake_json = """{
          "topic": "Heart Failure",
          "difficulty": "medium",
          "questions": [
            {
              "id": 1,
              "question": "Which drug class is first-line for HFrEF?",
              "options": {"A": "ACE inhibitors", "B": "ARBs", "C": "Beta-blockers", "D": "Diuretics"},
              "correct_answer": "A",
              "explanation": "ACE inhibitors reduce mortality in HFrEF."
            }
          ]
        }"""
        mock_client.return_value.system_user.return_value = (fake_json, False)

        r = client.post("/generate-mcq", json={"topic": "Heart Failure", "num_questions": 1})
        assert r.status_code == 200
        data = r.json()
        assert len(data["questions"]) == 1
        assert data["questions"][0]["correct_answer"] == "A"


class TestPatientSimulator:
    def test_list_cases(self):
        r = client.get("/simulate-patient/cases")
        assert r.status_code == 200
        data = r.json()
        assert "chest_pain" in data["available_cases"]

    def test_invalid_case_type(self):
        r = client.post("/simulate-patient", json={
            "session_id": "test-123",
            "user_message": "Hello",
            "case_type": "nonexistent_case"
        })
        assert r.status_code == 400

    @patch("app.routers.patient.get_groq_client")
    @patch("app.routers.patient.get_cache")
    def test_simulate_patient_chat(self, mock_cache, mock_client):
        mock_cache.return_value.get_session.return_value = []
        mock_cache.return_value.get.return_value = None
        mock_cache.return_value.set.return_value = True
        mock_client.return_value.complete.return_value = ("Ah, doctor, my chest hurts.", False)
        mock_client.return_value.make_cache_key.return_value = "mno345"

        payload = {
            "session_id": "test-session-999",
            "user_message": "Hello, how can I help you today?",
            "case_type": "chest_pain"
        }
        r = client.post("/simulate-patient", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["session_id"] == "test-session-999"
        assert data["patient_response"] == "Ah, doctor, my chest hurts."
        assert data["is_fallback"] is False


class TestRankPredictor:
    @patch("app.routers.rank.get_groq_client")
    @patch("app.routers.rank.get_cache")
    def test_predict_rank_success(self, mock_cache, mock_client):
        mock_cache.return_value.get.return_value = None
        mock_cache.return_value.set.return_value = True
        mock_client.return_value.system_user.return_value = ("AI analysis of candidate", False)
        mock_client.return_value.make_cache_key.return_value = "jkl012"

        payload = {
            "student_id": "student-test-01",
            "scores": {
                "anatomy": 80,
                "physiology": 75,
                "biochemistry": 70
            },
            "mock_rank": 1500,
            "total_students": 10000,
            "study_hours_per_day": 8.0,
            "months_remaining": 3.0,
            "target_college": "AIIMS Delhi"
        }

        r = client.post("/predict-rank", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["student_id"] == "student-test-01"
        assert data["rule_based"]["weighted_score"] == 75.0
        assert data["ai_inference"]["analysis"] == "AI analysis of candidate"
        assert data["is_fallback"] is False

    @patch("app.routers.rank.get_groq_client")
    @patch("app.routers.rank.get_cache")
    def test_predict_rank_pdf(self, mock_cache, mock_client):
        mock_cache.return_value.get.return_value = None
        mock_cache.return_value.set.return_value = True
        mock_client.return_value.system_user.return_value = ("AI analysis of candidate", False)
        mock_client.return_value.make_cache_key.return_value = "jkl012"

        payload = {
            "student_id": "student-test-01",
            "scores": {
                "anatomy": 80,
                "physiology": 75,
                "biochemistry": 70
            },
            "mock_rank": 1500,
            "total_students": 10000,
            "study_hours_per_day": 8.0,
            "months_remaining": 3.0,
            "target_college": "AIIMS Delhi"
        }

        r = client.post("/predict-rank?download=pdf", json=payload)
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"
        assert "rank_prediction" in r.headers["content-disposition"]
