"""
Seed script – Day 11
Seeds ChromaDB with the static MEDICAL_KNOWLEDGE_BASE on first startup.
Idempotent: skips seeding if documents already exist in the collection.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def seed_chroma_from_knowledge_base() -> None:
    """
    Import the static knowledge base and ingest it into ChromaDB.
    Only runs if the ChromaDB collection is empty (idempotent).
    """
    try:
        from app.rag.chroma_store import get_chroma_store
        from app.rag.embeddings import MEDICAL_KNOWLEDGE_BASE

        store = get_chroma_store()
        stats = store.stats()

        if stats.get("total_documents", 0) > 0:
            logger.info(
                "ChromaDB already seeded (%d docs). Skipping seed.",
                stats["total_documents"],
            )
            return

        logger.info("Seeding ChromaDB with %d knowledge base chunks…", len(MEDICAL_KNOWLEDGE_BASE))

        chunks = [item["text"] for item in MEDICAL_KNOWLEDGE_BASE]
        metadata_list = [
            {
                "topic": item["topic"],
                "source": "knowledge_base_seed",
                "chunk_index": i,
                "kb_id": item["id"],
            }
            for i, item in enumerate(MEDICAL_KNOWLEDGE_BASE)
        ]

        result = store.ingest_chunks(
            chunks=chunks,
            metadata_list=metadata_list,
            doc_id_prefix="kb",
        )
        logger.info("✅ ChromaDB seeded: %s", result)

    except Exception as exc:
        logger.warning("⚠️  ChromaDB seed failed (non-fatal): %s", exc)
