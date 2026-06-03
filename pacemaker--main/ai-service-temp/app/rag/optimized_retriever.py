"""
Optimized RAG Retriever – Day 12
- Batch embedding: processes multiple queries simultaneously
- Redis embedding cache: avoids re-computing embeddings for repeated queries
- Hybrid retrieval: ChromaDB first, falls back to in-memory MedicalRAG
- Performance metrics: tracks retrieval latency
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from dataclasses import dataclass
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Embedding cache TTL in Redis (1 hour — embeddings don't change for same text)
EMBEDDING_CACHE_TTL = 3600
EMBEDDING_CACHE_PREFIX = "emb:"


@dataclass
class RAGResult:
    """Unified result object for both ChromaDB and in-memory RAG."""
    id: str
    topic: str
    text: str
    score: float
    source: str = "knowledge_base"


class OptimizedRAGRetriever:
    """
    High-performance RAG retriever with:
    1. Batch embedding for multiple simultaneous queries
    2. Redis embedding cache to skip re-computation
    3. ChromaDB primary retrieval with in-memory fallback
    4. Latency tracking
    """

    _instance: "OptimizedRAGRetriever | None" = None

    def __init__(self):
        self._model = None
        self._model_loaded = False
        self._stats = {"total_queries": 0, "cache_hits": 0, "total_latency_ms": 0.0}

    # ── Model Loading ─────────────────────────────────────────────────────────

    def _load_model(self):
        """Lazy-load the sentence-transformer model once."""
        if self._model_loaded:
            return
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
            self._model_loaded = True
            logger.info("✅ OptimizedRAGRetriever: embedding model loaded.")
        except Exception as exc:
            logger.error("Failed to load embedding model: %s", exc)

    # ── Embedding Cache ───────────────────────────────────────────────────────

    @staticmethod
    def _embed_cache_key(text: str) -> str:
        return EMBEDDING_CACHE_PREFIX + hashlib.sha256(text.encode()).hexdigest()[:32]

    def _get_cached_embedding(self, text: str) -> Optional[np.ndarray]:
        """Try to retrieve a pre-computed embedding from Redis."""
        try:
            from app.cache import get_cache
            cache = get_cache()
            if not cache.available:
                return None
            raw = cache._redis.get(self._embed_cache_key(text))
            if raw:
                arr = np.array(json.loads(raw), dtype=np.float32)
                logger.debug("Embedding cache HIT for text[:40]='%s…'", text[:40])
                return arr
        except Exception as exc:
            logger.debug("Embedding cache GET error: %s", exc)
        return None

    def _cache_embedding(self, text: str, embedding: np.ndarray) -> None:
        """Store a computed embedding in Redis for future reuse."""
        try:
            from app.cache import get_cache
            cache = get_cache()
            if not cache.available:
                return
            cache._redis.setex(
                self._embed_cache_key(text),
                EMBEDDING_CACHE_TTL,
                json.dumps(embedding.tolist()),
            )
        except Exception as exc:
            logger.debug("Embedding cache SET error: %s", exc)

    # ── Batch Embedding ───────────────────────────────────────────────────────

    def embed_batch(self, texts: list[str]) -> np.ndarray:
        """
        Embed a batch of texts with caching.
        - Checks Redis cache per text first
        - Only calls the model for cache-miss texts
        - Returns embeddings in original order

        Args:
            texts: List of strings to embed.

        Returns:
            2D numpy array of shape (len(texts), embedding_dim).
        """
        self._load_model()
        if not self._model_loaded:
            raise RuntimeError("Embedding model not available.")

        embeddings: list[Optional[np.ndarray]] = [None] * len(texts)
        uncached_indices: list[int] = []
        uncached_texts: list[str] = []

        # Check cache for each text
        for i, text in enumerate(texts):
            cached = self._get_cached_embedding(text)
            if cached is not None:
                embeddings[i] = cached
                self._stats["cache_hits"] += 1
            else:
                uncached_indices.append(i)
                uncached_texts.append(text)

        # Batch-embed only the cache-miss texts
        if uncached_texts:
            logger.debug("Batch embedding %d texts (cached: %d)…",
                         len(uncached_texts), len(texts) - len(uncached_texts))
            computed = self._model.encode(
                uncached_texts,
                batch_size=32,
                show_progress_bar=False,
                convert_to_numpy=True,
            )
            # Store results and cache them
            for idx, emb in zip(uncached_indices, computed):
                embeddings[idx] = emb
                self._cache_embedding(texts[idx], emb)

        return np.vstack(embeddings)

    # ── Retrieval ─────────────────────────────────────────────────────────────

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
        topic_filter: Optional[str] = None,
    ) -> list[RAGResult]:
        """
        Retrieve top-K relevant chunks for the given query.
        Strategy:
          1. Try ChromaDB (persistent, larger knowledge base)
          2. Fall back to in-memory MedicalRAG if ChromaDB is empty/unavailable

        Args:
            query: Natural language question.
            top_k: Number of results.
            topic_filter: Optional topic to filter by.

        Returns:
            List of RAGResult objects sorted by descending score.
        """
        start = time.perf_counter()
        self._stats["total_queries"] += 1

        results = self._retrieve_chroma(query, top_k, topic_filter)

        # Fall back to in-memory if ChromaDB returned nothing
        if not results:
            logger.debug("ChromaDB returned 0 results — using in-memory fallback.")
            results = self._retrieve_inmemory(query, top_k)

        latency_ms = (time.perf_counter() - start) * 1000
        self._stats["total_latency_ms"] += latency_ms
        logger.debug(
            "RAG retrieve: query='%s…' top_k=%d results=%d latency=%.1fms",
            query[:40], top_k, len(results), latency_ms,
        )
        return results

    def retrieve_batch(
        self,
        queries: list[str],
        top_k: int = 3,
    ) -> list[list[RAGResult]]:
        """
        Retrieve results for multiple queries simultaneously using batch embedding.
        More efficient than calling retrieve() in a loop.

        Args:
            queries: List of query strings.
            top_k: Number of results per query.

        Returns:
            List of RAGResult lists, one per query.
        """
        if not queries:
            return []

        self._load_model()
        start = time.perf_counter()

        # Batch-embed all queries at once
        query_embeddings = self.embed_batch(queries)

        # Retrieve for each query using its embedding
        all_results = []
        for i, query in enumerate(queries):
            results = self._retrieve_chroma_with_embedding(
                query_embeddings[i:i+1], top_k
            )
            if not results:
                results = self._retrieve_inmemory(query, top_k)
            all_results.append(results)

        latency_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "Batch RAG: %d queries, %d total results, %.1fms total",
            len(queries), sum(len(r) for r in all_results), latency_ms,
        )
        return all_results

    # ── Internal Helpers ──────────────────────────────────────────────────────

    def _retrieve_chroma(
        self,
        query: str,
        top_k: int,
        topic_filter: Optional[str] = None,
    ) -> list[RAGResult]:
        """Retrieve from ChromaDB using fresh query embedding."""
        try:
            from app.rag.chroma_store import get_chroma_store
            store = get_chroma_store()
            raw = store.retrieve(query, top_k=top_k, topic_filter=topic_filter)
            return [
                RAGResult(
                    id=r["id"],
                    topic=r.get("topic", "unknown"),
                    text=r["text"],
                    score=r.get("score", 0.0),
                    source=r.get("source", "chromadb"),
                )
                for r in raw
            ]
        except Exception as exc:
            logger.warning("ChromaDB retrieve error: %s", exc)
            return []

    def _retrieve_chroma_with_embedding(
        self,
        query_emb: np.ndarray,
        top_k: int,
    ) -> list[RAGResult]:
        """Retrieve from ChromaDB using a pre-computed embedding (for batch ops)."""
        try:
            from app.rag.chroma_store import get_chroma_store
            store = get_chroma_store()
            store._init()
            if not store._ready or store._collection.count() == 0:
                return []

            results = store._collection.query(
                query_embeddings=query_emb.tolist(),
                n_results=min(top_k, store._collection.count()),
                include=["documents", "metadatas", "distances"],
            )
            output = []
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 1.0
                output.append(RAGResult(
                    id=results["ids"][0][i],
                    topic=meta.get("topic", "unknown"),
                    text=doc,
                    score=round(1.0 - float(distance), 4),
                    source=meta.get("source", "chromadb"),
                ))
            return output
        except Exception as exc:
            logger.warning("ChromaDB batch retrieve error: %s", exc)
            return []

    def _retrieve_inmemory(self, query: str, top_k: int) -> list[RAGResult]:
        """Fallback: retrieve from the original in-memory MedicalRAG."""
        try:
            from app.rag.embeddings import get_rag
            rag = get_rag()
            chunks = rag.retrieve(query, top_k=top_k)
            return [
                RAGResult(id=c.id, topic=c.topic, text=c.text, score=c.score, source="in_memory")
                for c in chunks
            ]
        except Exception as exc:
            logger.warning("In-memory RAG fallback error: %s", exc)
            return []

    # ── Stats ─────────────────────────────────────────────────────────────────

    def get_stats(self) -> dict:
        total = self._stats["total_queries"]
        avg_latency = (
            round(self._stats["total_latency_ms"] / total, 1) if total else 0.0
        )
        return {
            "total_queries": total,
            "embedding_cache_hits": self._stats["cache_hits"],
            "avg_latency_ms": avg_latency,
        }

    # ── Singleton ─────────────────────────────────────────────────────────────

    @classmethod
    def get_instance(cls) -> "OptimizedRAGRetriever":
        if cls._instance is None:
            cls._instance = OptimizedRAGRetriever()
        return cls._instance


def get_optimized_rag() -> OptimizedRAGRetriever:
    return OptimizedRAGRetriever.get_instance()
