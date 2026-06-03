"""
FastAPI application entry point – Task 1
Registers all routers, middleware, and lifecycle events.
"""
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.cache import get_cache, CacheStats
from app.groq_client import get_groq_client
from app.routers import tutor, mcq, patient, rank, ingest, question_generator
from app.fallback_responses import GROQ_STATUS_OK, GROQ_STATUS_UNAVAILABLE
from app.rag.seed import seed_chroma_from_knowledge_base
from app.rag.optimized_retriever import get_optimized_rag
from app.rag.chroma_store import get_chroma_store

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("🚀 Starting Groq AI Service [env=%s]", settings.app_env)
    logger.info("🤖 Model: %s", settings.groq_model)

    # Pre-warm Groq client
    get_groq_client()

    # Test Redis connection
    cache = get_cache()
    if cache.available:
        logger.info("✅ Redis connected and ready.")
    else:
        logger.warning("⚠️  Redis unavailable – caching disabled.")

    # Seed ChromaDB with static knowledge base (idempotent)
    seed_chroma_from_knowledge_base()

    yield  # Application runs here

    logger.info("🛑 Shutting down Groq AI Service.")


# ── FastAPI App ────────────────────────────────────────────────────────────────
settings = get_settings()

app = FastAPI(
    title="🧠 Groq Medical AI Service",
    description=(
        "A production-ready FastAPI service powered by **Groq AI (LLaMA 3.1)** for medical education.\n\n"
        "## Features\n"
        "- **`/tutor/explain`** – Structured AI explanations for any medical topic\n"
        "- **`/tutor/ask`** – RAG-powered Q&A grounded in a medical knowledge base\n"
        "- **`/generate-mcq`** – Auto-generate MCQs for exam prep\n"
        "- **`/simulate-patient`** – Multi-turn patient encounter simulation\n"
        "- **Redis caching** – SHA-256 keyed responses with 15-min TTL\n"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request timing middleware ──────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(duration_ms)
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(tutor.router)
app.include_router(mcq.router)
app.include_router(patient.router)
app.include_router(rank.router)
app.include_router(ingest.router)
app.include_router(question_generator.router)

# ── Static files ──────────────────────────────────────────────────────────────
_static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(_static_dir)), name="static")


@app.get("/download", tags=["System"], summary="PDF Download Page", response_class=HTMLResponse)
async def download_page():
    """Beautiful UI page for downloading AI responses as PDF files."""
    html_file = _static_dir / "download.html"
    return HTMLResponse(content=html_file.read_text(encoding="utf-8"))


# ── Root & Health ─────────────────────────────────────────────────────────────
@app.get("/redoc", tags=["System"], summary="ReDoc API documentation", include_in_schema=False)
async def redoc_html():
    """ReDoc alternative API documentation."""
    html = """<!DOCTYPE html>
<html>
  <head>
    <title>Groq Medical AI Service - API Reference</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; padding: 0; font-family: sans-serif; }
      #redoc-container { height: 100vh; }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script src="/static/redoc.standalone.js"></script>
    <script>
      Redoc.init(
        '/openapi.json',
        {
          scrollYOffset: 50,
          hideDownloadButton: false,
          theme: {
            colors: { primary: { main: '#0070f3' } },
            typography: { fontSize: '15px', headingsFont: { family: 'sans-serif' } }
          }
        },
        document.getElementById('redoc-container')
      );
    </script>
  </body>
</html>"""
    return HTMLResponse(content=html)


@app.get("/", tags=["System"], summary="API root")
async def root():
    return {
        "service": "Groq Medical AI Service",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": [
            "POST /tutor/explain",
            "POST /tutor/ask",
            "POST /generate-mcq",
            "POST /simulate-patient",
            "GET  /simulate-patient/cases",
            "POST /predict-rank",
            "POST /ingest/text",
            "POST /ingest/file",
            "GET  /ingest/stats",
            "DELETE /ingest/clear",
            "GET  /download",
            "GET  /health",
            "GET  /cache/stats",
        ],
    }


@app.get("/health", tags=["System"], summary="Health check – Redis, Groq API, and fallback status")
async def health():
    """
    Returns the live status of all service components:
    - **redis**: whether Redis cache is connected
    - **groq_api**: whether Groq AI API is reachable (lightweight probe)
    - **fallback_mode**: True when Groq is down and static responses will be served
    - **cache_stats**: current hit/miss counters for this process
    """
    cache = get_cache()

    # ── Probe Groq API with a minimal call ────────────────────────────────────
    client = get_groq_client()
    _, groq_failed = client.system_user(
        system_prompt="You are a health-check probe. Reply with exactly one word.",
        user_prompt="Ping",
        max_tokens=5,
        fallback="PROBE_FAILED",
        timeout=2.0,
        bypass_retry=True,
    )
    groq_status = GROQ_STATUS_UNAVAILABLE if groq_failed else GROQ_STATUS_OK
    fallback_mode = groq_failed

    overall = "degraded" if groq_failed else "healthy"

    # ChromaDB and RAG stats
    chroma_stats = get_chroma_store().stats()
    rag_stats = get_optimized_rag().get_stats()

    return {
        "status": overall,
        "model": settings.groq_model,
        "groq_api": groq_status,
        "fallback_mode": fallback_mode,
        "redis": "connected" if cache.available else "unavailable",
        "cache_stats": CacheStats.summary(),
        "chroma_db": chroma_stats,
        "rag_stats": rag_stats,
    }


@app.get("/cache/stats", tags=["System"], summary="Cache hit/miss statistics")
async def cache_stats():
    """Returns cumulative Redis cache hit/miss counters for this process."""
    stats = CacheStats.summary()
    return {
        "cache_hits": stats["hits"],
        "cache_misses": stats["misses"],
        "hit_rate_pct": stats["hit_rate_pct"],
        "ttl_seconds": settings.redis_cache_ttl,
        "redis_available": get_cache().available,
    }


# ── Global Exception Handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
    )
