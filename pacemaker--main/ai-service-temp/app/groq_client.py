"""
GroqClient – Task 2
- 3-retry exponential backoff via tenacity
- Fallback response when all retries exhausted
- Async & sync compatible
"""
import logging
import hashlib
from typing import Optional

from groq import Groq, APIError, RateLimitError, APITimeoutError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import get_settings

logger = logging.getLogger(__name__)

# Exceptions that trigger a retry
_RETRYABLE = (RateLimitError, APITimeoutError, APIError)

FALLBACK_RESPONSE = (
    "I'm temporarily unable to process your request due to high demand. "
    "Please try again in a moment. If this persists, contact support."
)


class GroqClient:
    """Wrapper around the Groq SDK with retry logic and Redis cache support."""

    def __init__(self):
        settings = get_settings()
        self._client = Groq(api_key=settings.groq_api_key)
        self._model = settings.groq_model
        self._max_tokens = settings.groq_max_tokens
        self._temperature = settings.groq_temperature

    def _raw_request(
        self,
        messages: list[dict],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        timeout: Optional[float] = None,
    ) -> str:
        """Make a single Groq chat completion call without retry, with specified timeout (default 10s)."""
        response = self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            max_tokens=max_tokens or self._max_tokens,
            temperature=temperature if temperature is not None else self._temperature,
            timeout=timeout if timeout is not None else 10.0,
        )
        return response.choices[0].message.content or ""

    # ------------------------------------------------------------------
    # Internal retry-decorated method
    # ------------------------------------------------------------------
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(_RETRYABLE),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=False,
    )
    def _call_api(
        self,
        messages: list[dict],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> str:
        """Make a single Groq chat completion call (with auto-retry)."""
        return self._raw_request(messages, max_tokens, temperature)

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------
    def complete(
        self,
        messages: list[dict],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        fallback: Optional[str] = None,
        timeout: Optional[float] = None,
        bypass_retry: bool = False,
    ) -> tuple[str, bool]:
        """
        Call Groq with retry logic (unless bypass_retry is True).

        Returns
        -------
        (content, is_fallback) tuple.
        """
        try:
            if bypass_retry:
                content = self._raw_request(messages, max_tokens, temperature, timeout)
            else:
                content = self._call_api(messages, max_tokens, temperature)
            return content, False
        except Exception as exc:
            logger.error("Groq call failed (bypass_retry=%s): %s", bypass_retry, exc)
            return fallback or FALLBACK_RESPONSE, True

    def system_user(
        self,
        system_prompt: str,
        user_prompt: str,
        **kwargs,
    ) -> tuple[str, bool]:
        """Convenience helper: build messages and call complete()."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        return self.complete(messages, **kwargs)

    @staticmethod
    def make_cache_key(prompt: str) -> str:
        """SHA-256 hash of the full prompt string – used as Redis key."""
        return hashlib.sha256(prompt.encode()).hexdigest()


# Module-level singleton
_groq_client: Optional[GroqClient] = None


def get_groq_client() -> GroqClient:
    global _groq_client
    if _groq_client is None:
        _groq_client = GroqClient()
    return _groq_client
