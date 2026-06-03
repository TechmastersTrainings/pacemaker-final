"""
/ingest  –  Document ingestion router – Day 11
Allows uploading raw text or plain-text files into the ChromaDB vector store.
Ingested documents become immediately retrievable by the RAG tutor.
"""
from __future__ import annotations

import io
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import pypdf
from pydantic import BaseModel, Field

from app.rag.chroma_store import get_chroma_store

router = APIRouter(prefix="/ingest", tags=["Document Ingestion"])
logger = logging.getLogger(__name__)


# ── Request / Response schemas ────────────────────────────────────────────────

class IngestTextRequest(BaseModel):
    text: str = Field(..., min_length=20, description="Full document text to ingest")
    topic: str = Field("general", description="Medical topic label (e.g. 'cardiology')")
    source: str = Field("manual_upload", description="Source identifier (e.g. filename)")
    chunk_size: int = Field(400, ge=100, le=2000, description="Max characters per chunk")
    overlap: int = Field(80, ge=0, le=400, description="Character overlap between chunks")

    model_config = {"json_schema_extra": {
        "example": {
            "text": "Hypertension is defined as sustained blood pressure above 140/90 mmHg...",
            "topic": "cardiology",
            "source": "hypertension_notes.txt",
        }
    }}


class IngestResponse(BaseModel):
    status: str
    ingested: int
    total_in_store: int
    message: Optional[str] = None
    ids: Optional[list[str]] = None


class StoreStatsResponse(BaseModel):
    status: str
    collection: Optional[str] = None
    total_documents: int
    persist_dir: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/text",
    response_model=IngestResponse,
    summary="Ingest raw text into ChromaDB",
    description=(
        "Chunks the supplied text and stores it as embeddings in ChromaDB. "
        "Ingested documents are immediately searchable by the `/tutor/ask` RAG endpoint."
    ),
)
async def ingest_text(body: IngestTextRequest) -> IngestResponse:
    """Ingest a plain-text document into the persistent vector store."""
    store = get_chroma_store()
    result = store.ingest_text(
        text=body.text,
        topic=body.topic,
        source=body.source,
        chunk_size=body.chunk_size,
        overlap=body.overlap,
    )
    if result.get("status") == "error":
        raise HTTPException(status_code=503, detail=result.get("message", "Ingestion failed"))

    return IngestResponse(
        status=result["status"],
        ingested=result.get("ingested", 0),
        total_in_store=result.get("total_in_store", 0),
        message=result.get("message"),
        ids=result.get("ids"),
    )


@router.post(
    "/file",
    response_model=IngestResponse,
    summary="Upload a file into ChromaDB",
    description=(
        "Upload a `.txt`, `.md`, or `.pdf` file for ingestion. "
        "The file is chunked and embedded automatically."
    ),
)
async def ingest_file(
    file: UploadFile = File(..., description="File (.txt, .md, or .pdf) to ingest"),
    topic: str = Form("general", description="Medical topic label"),
    chunk_size: int = Form(400, ge=100, le=2000),
    overlap: int = Form(80, ge=0, le=400),
) -> IngestResponse:
    """Ingest an uploaded text or PDF file into the persistent vector store."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    allowed_exts = {".txt", ".md", ".pdf"}
    suffix = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if suffix not in allowed_exts:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{suffix}'. Only {allowed_exts} accepted.",
        )

    raw_bytes = await file.read()
    if suffix == ".pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            text = "\n".join(text_parts)
        except Exception as e:
            logger.exception("Failed to parse PDF file '%s'", file.filename)
            raise HTTPException(status_code=422, detail=f"Failed to parse PDF file: {str(e)}")
    else:
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = raw_bytes.decode("latin-1")

    if len(text.strip()) < 20:
        raise HTTPException(status_code=400, detail="File content too short to ingest.")

    store = get_chroma_store()
    result = store.ingest_text(
        text=text,
        topic=topic,
        source=file.filename,
        chunk_size=chunk_size,
        overlap=overlap,
    )

    if result.get("status") == "error":
        raise HTTPException(status_code=503, detail=result.get("message", "Ingestion failed"))

    logger.info("Ingested file '%s' → %d chunks", file.filename, result.get("ingested", 0))
    return IngestResponse(
        status=result["status"],
        ingested=result.get("ingested", 0),
        total_in_store=result.get("total_in_store", 0),
        message=result.get("message"),
        ids=result.get("ids"),
    )


@router.get(
    "/stats",
    response_model=StoreStatsResponse,
    summary="Get ChromaDB vector store statistics",
)
async def store_stats() -> StoreStatsResponse:
    """Returns the current state of the ChromaDB vector collection."""
    store = get_chroma_store()
    stats = store.stats()
    return StoreStatsResponse(
        status=stats.get("status", "unknown"),
        collection=stats.get("collection"),
        total_documents=stats.get("total_documents", 0),
        persist_dir=stats.get("persist_dir"),
    )


@router.delete(
    "/clear",
    summary="Clear all documents from ChromaDB",
    description="⚠️ Destructive: drops and recreates the vector collection.",
)
async def clear_store() -> dict:
    """Drop and recreate the ChromaDB collection (removes all ingested documents)."""
    store = get_chroma_store()
    result = store.delete_collection()
    return result
