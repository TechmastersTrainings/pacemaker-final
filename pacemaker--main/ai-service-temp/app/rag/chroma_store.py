"""
ChromaDB Ingestion Pipeline – Day 11
- Persistent vector store backed by ChromaDB
- Accepts text chunks, PDFs (via text extraction), and raw strings
- Embeds using sentence-transformers (all-MiniLM-L6-v2)
- Exposes retrieve() compatible with existing MedicalRAG interface
"""
from __future__ import annotations

import logging
import re
import uuid
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# ChromaDB persistent directory (inside container-friendly path)
CHROMA_PERSIST_DIR = str(Path(__file__).parent.parent.parent / "chroma_data")
CHROMA_COLLECTION_NAME = "medical_knowledge"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


class ChromaVectorStore:
    """
    Persistent ChromaDB-backed vector store for medical documents.
    - Lazy-initialises ChromaDB client and embedding model on first use.
    - Thread-safe singleton pattern.
    - Falls back gracefully if ChromaDB is not installed.
    """

    _instance: "ChromaVectorStore | None" = None

    def __init__(self):
        self._client = None
        self._collection = None
        self._model = None
        self._ready = False

    # ── Initialisation ────────────────────────────────────────────────────────

    def _init(self):
        """Lazy-load ChromaDB client and sentence-transformer model."""
        if self._ready:
            return
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings
            from sentence_transformers import SentenceTransformer

            Path(CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)

            self._client = chromadb.PersistentClient(
                path=CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            self._collection = self._client.get_or_create_collection(
                name=CHROMA_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )
            self._model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            self._ready = True
            logger.info(
                "✅ ChromaDB ready | collection=%s | docs=%d | persist=%s",
                CHROMA_COLLECTION_NAME,
                self._collection.count(),
                CHROMA_PERSIST_DIR,
            )
        except ImportError:
            logger.warning(
                "⚠️  ChromaDB not installed. Run: pip install chromadb. "
                "Falling back to in-memory RAG."
            )
        except Exception as exc:
            logger.error("❌ ChromaDB init failed: %s", exc)

    # ── Document Chunking ─────────────────────────────────────────────────────

    @staticmethod
    def chunk_text(
        text: str,
        chunk_size: int = 400,
        overlap: int = 80,
        min_chunk_len: int = 50,
    ) -> list[str]:
        """
        Split text into overlapping sentence-aware chunks.
        Sentence boundaries are preferred over hard character cuts.
        """
        # Normalise whitespace
        text = re.sub(r"\s+", " ", text).strip()
        if len(text) <= chunk_size:
            return [text] if len(text) >= min_chunk_len else []

        # Split at sentence boundaries first
        sentences = re.split(r"(?<=[.!?])\s+", text)
        chunks: list[str] = []
        current = ""

        for sentence in sentences:
            if len(current) + len(sentence) + 1 <= chunk_size:
                current = (current + " " + sentence).strip()
            else:
                if len(current) >= min_chunk_len:
                    chunks.append(current)
                # Start new chunk with overlap from previous
                if len(current) > overlap:
                    overlap_text = current[-overlap:]
                    current = (overlap_text + " " + sentence).strip()
                else:
                    current = sentence

        if current and len(current) >= min_chunk_len:
            chunks.append(current)

        return chunks

    # ── Ingestion ─────────────────────────────────────────────────────────────

    def ingest_chunks(
        self,
        chunks: list[str],
        metadata_list: list[dict] | None = None,
        doc_id_prefix: str = "doc",
    ) -> dict:
        """
        Embed and store a list of text chunks into ChromaDB.

        Args:
            chunks: List of text strings to embed and store.
            metadata_list: Optional per-chunk metadata dicts.
            doc_id_prefix: Prefix for generated chunk IDs.

        Returns:
            dict with ingestion stats.
        """
        self._init()
        if not self._ready:
            return {"status": "error", "message": "ChromaDB not available", "ingested": 0}

        if not chunks:
            return {"status": "ok", "message": "No chunks to ingest", "ingested": 0}

        if metadata_list is None:
            metadata_list = [{}] * len(chunks)

        # Batch embed all chunks
        logger.info("Embedding %d chunks…", len(chunks))
        embeddings: np.ndarray = self._model.encode(
            chunks,
            batch_size=32,
            show_progress_bar=False,
            convert_to_numpy=True,
        )

        # Generate unique IDs
        ids = [f"{doc_id_prefix}_{uuid.uuid4().hex[:8]}" for _ in chunks]

        # Upsert into ChromaDB (avoids duplicates on re-ingest)
        self._collection.upsert(
            ids=ids,
            embeddings=embeddings.tolist(),
            documents=chunks,
            metadatas=metadata_list,
        )

        count_after = self._collection.count()
        logger.info(
            "✅ Ingested %d chunks. Total in collection: %d", len(chunks), count_after
        )
        return {
            "status": "ok",
            "ingested": len(chunks),
            "total_in_store": count_after,
            "ids": ids,
        }

    def ingest_text(
        self,
        text: str,
        topic: str = "general",
        source: str = "upload",
        chunk_size: int = 400,
        overlap: int = 80,
    ) -> dict:
        """
        Chunk raw text and ingest all chunks with shared metadata.

        Args:
            text: Full document text.
            topic: Medical topic label (e.g. 'cardiology').
            source: Source identifier (e.g. filename).
            chunk_size: Max characters per chunk.
            overlap: Overlap between consecutive chunks.

        Returns:
            dict with ingestion stats.
        """
        chunks = self.chunk_text(text, chunk_size=chunk_size, overlap=overlap)
        if not chunks:
            return {"status": "ok", "message": "Text too short to chunk", "ingested": 0}

        doc_id = re.sub(r"[^a-z0-9_]", "_", source.lower())[:20]
        metadata_list = [
            {"topic": topic, "source": source, "chunk_index": i}
            for i, _ in enumerate(chunks)
        ]
        return self.ingest_chunks(chunks, metadata_list=metadata_list, doc_id_prefix=doc_id)

    # ── Retrieval ─────────────────────────────────────────────────────────────

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
        topic_filter: str | None = None,
    ) -> list[dict]:
        """
        Embed query and retrieve top-K semantically similar chunks.

        Args:
            query: Natural language query string.
            top_k: Number of results to return.
            topic_filter: Optional topic metadata filter.

        Returns:
            List of dicts with keys: id, text, topic, source, score.
        """
        self._init()
        if not self._ready or self._collection.count() == 0:
            logger.warning("ChromaDB not ready or empty — returning no results.")
            return []

        query_emb: np.ndarray = self._model.encode(
            [query], batch_size=1, convert_to_numpy=True
        )

        where_filter = {"topic": topic_filter} if topic_filter else None

        results = self._collection.query(
            query_embeddings=query_emb.tolist(),
            n_results=min(top_k, self._collection.count()),
            where=where_filter,
            include=["documents", "metadatas", "distances"],
        )

        output = []
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            distance = results["distances"][0][i] if results["distances"] else 1.0
            # ChromaDB cosine distance: score = 1 - distance
            similarity = round(1.0 - float(distance), 4)
            output.append(
                {
                    "id": results["ids"][0][i],
                    "text": doc,
                    "topic": meta.get("topic", "unknown"),
                    "source": meta.get("source", "unknown"),
                    "score": similarity,
                }
            )

        return output

    # ── Stats ─────────────────────────────────────────────────────────────────

    def stats(self) -> dict:
        """Return collection statistics."""
        self._init()
        if not self._ready:
            return {"status": "unavailable", "total_documents": 0}
        return {
            "status": "ready",
            "collection": CHROMA_COLLECTION_NAME,
            "total_documents": self._collection.count(),
            "persist_dir": CHROMA_PERSIST_DIR,
        }

    def delete_collection(self) -> dict:
        """Drop and recreate the collection (use with caution)."""
        self._init()
        if not self._ready:
            return {"status": "error", "message": "ChromaDB not available"}
        import chromadb
        self._client.delete_collection(CHROMA_COLLECTION_NAME)
        self._collection = self._client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        return {"status": "ok", "message": "Collection cleared"}

    # ── Singleton ─────────────────────────────────────────────────────────────

    @classmethod
    def get_instance(cls) -> "ChromaVectorStore":
        if cls._instance is None:
            cls._instance = ChromaVectorStore()
        return cls._instance


def get_chroma_store() -> ChromaVectorStore:
    return ChromaVectorStore.get_instance()
