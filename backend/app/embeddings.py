from functools import lru_cache
from threading import Lock
from sentence_transformers import SentenceTransformer
from .config import MODEL_ID, MODEL_REVISION, DIMENSIONS

class Encoder:
    """One pinned, CPU-based model per process. No hosted inference or fake fallback."""
    def __init__(self):
        self.model = SentenceTransformer(MODEL_ID, revision=MODEL_REVISION, device='cpu', trust_remote_code=False)
        self.lock = Lock()

    @lru_cache(maxsize=128)
    def encode(self, text: str) -> tuple[float, ...]:
        with self.lock:
            vector = self.model.encode(text, normalize_embeddings=True)
        if vector.shape != (DIMENSIONS,):
            raise RuntimeError('Unexpected model dimensions')
        return tuple(float(x) for x in vector)

    def batch(self, texts: list[str]):
        with self.lock:
            return self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
