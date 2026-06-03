import logging
import sys

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("scratch_check")

logger.info("Importing chromadb...")
import chromadb
logger.info("Imported chromadb.")

logger.info("Importing SentenceTransformer...")
from sentence_transformers import SentenceTransformer
logger.info("Imported SentenceTransformer.")

logger.info("Loading SentenceTransformer model all-MiniLM-L6-v2...")
model = SentenceTransformer("all-MiniLM-L6-v2")
logger.info("Loaded SentenceTransformer model.")

logger.info("Testing embedding...")
embeddings = model.encode(["hello world"])
logger.info("Embedding done: %s", embeddings.shape)
