"""
Tests for GroqClient retry logic and fallback behaviour.
"""
import pytest
from unittest.mock import patch, MagicMock
from groq import RateLimitError

from app.groq_client import GroqClient, FALLBACK_RESPONSE


class TestGroqClientCacheKey:
    def test_cache_key_is_sha256(self):
        key = GroqClient.make_cache_key("hello world")
        assert len(key) == 64
        assert all(c in "0123456789abcdef" for c in key)

    def test_same_prompt_same_key(self):
        assert GroqClient.make_cache_key("test") == GroqClient.make_cache_key("test")

    def test_different_prompts_different_keys(self):
        assert GroqClient.make_cache_key("a") != GroqClient.make_cache_key("b")


class TestGroqClientFallback:
    """Test that fallback is returned when API repeatedly fails."""

    def test_fallback_on_persistent_error(self, monkeypatch):
        client = GroqClient.__new__(GroqClient)
        # Simulate _call_api always raising
        def always_fail(*args, **kwargs):
            raise Exception("Simulated API failure")

        monkeypatch.setattr(client, "_call_api", always_fail)
        content, is_fallback = client.complete([{"role": "user", "content": "hi"}])
        assert is_fallback is True
        assert content == FALLBACK_RESPONSE

    def test_custom_fallback_message(self, monkeypatch):
        client = GroqClient.__new__(GroqClient)
        monkeypatch.setattr(client, "_call_api", lambda *a, **k: (_ for _ in ()).throw(Exception("fail")))
        content, is_fallback = client.complete(
            [{"role": "user", "content": "hi"}],
            fallback="Custom fallback message"
        )
        assert is_fallback is True
        assert content == "Custom fallback message"


class TestGroqClientSuccess:
    """Test normal success path."""

    def test_success_returns_is_fallback_false(self, monkeypatch):
        client = GroqClient.__new__(GroqClient)
        monkeypatch.setattr(client, "_call_api", lambda *a, **k: "AI response text")
        content, is_fallback = client.complete([{"role": "user", "content": "hi"}])
        assert is_fallback is False
        assert content == "AI response text"
