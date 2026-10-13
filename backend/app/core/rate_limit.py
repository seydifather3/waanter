import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status

ALL_LIMITERS: list["RateLimiter"] = []


class RateLimiter:
    """
    Limiteur simple en memoire : au plus `max_requests` appels par adresse IP
    sur une fenetre glissante de `window_seconds` secondes.
    Utilise comme dependance FastAPI.
    """

    def __init__(self, name: str, max_requests: int, window_seconds: int):
        self.name = name
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()
        ALL_LIMITERS.append(self)

    def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "inconnu"
        now = time.monotonic()

        with self._lock:
            hits = self._hits[client_ip]
            while hits and now - hits[0] >= self.window_seconds:
                hits.popleft()

            if len(hits) >= self.max_requests:
                retry_after = max(1, int(self.window_seconds - (now - hits[0])) + 1)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Trop de tentatives. Réessayez dans quelques minutes.",
                    headers={"Retry-After": str(retry_after)},
                )

            hits.append(now)

            # Nettoyage occasionnel pour ne pas faire grossir la memoire
            if len(self._hits) > 5000:
                self._purge(now)

    def _purge(self, now: float) -> None:
        stale = [
            ip
            for ip, hits in self._hits.items()
            if not hits or now - hits[-1] >= self.window_seconds
        ]
        for ip in stale:
            del self._hits[ip]

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def reset_all_limiters() -> None:
    for limiter in ALL_LIMITERS:
        limiter.reset()


# Seuils modifiables ici
login_limiter = RateLimiter("login", max_requests=15, window_seconds=300)
register_limiter = RateLimiter("register", max_requests=10, window_seconds=3600)
order_limiter = RateLimiter("order", max_requests=20, window_seconds=600)