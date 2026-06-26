import random
from dataclasses import dataclass
from datetime import datetime, timezone

from app.domain.entities.card import CardState


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@dataclass
class SessionCandidate:
    card_id: int
    english: str
    translation: str
    context: str | None
    cluster: str | None
    state: CardState
    due: datetime
    lapses: int
    reps: int
    priority: float
    bucket: str
    overview: str | None = None
    overview_status: str = "idle"
    roast: str | None = None
    roast_status: str = "idle"


class SessionBuilder:
    """
    Builds a swipe session queue from multiple buckets:
    due (30%), weak (25%), new (20%), cluster (15%), refresh (10%).
    """

    BUCKET_WEIGHTS = {
        "due": 0.30,
        "weak": 0.25,
        "new": 0.20,
        "cluster": 0.15,
        "refresh": 0.10,
    }

    def __init__(self, session_size: int = 30, daily_new_limit: int = 20) -> None:
        self.session_size = session_size
        self.daily_new_limit = daily_new_limit

    def build(
        self,
        candidates: list[SessionCandidate],
        now: datetime | None = None,
        new_today_count: int = 0,
        focus_cluster: str | None = None,
    ) -> list[SessionCandidate]:
        review_time = now or datetime.now(timezone.utc)
        if review_time.tzinfo is None:
            review_time = review_time.replace(tzinfo=timezone.utc)

        due = [
            c for c in candidates
            if c.state != CardState.GRADUATED and _ensure_utc(c.due) <= review_time
        ]
        weak = sorted(
            [c for c in candidates if c.lapses > 0 and c.state != CardState.GRADUATED],
            key=lambda c: c.lapses,
            reverse=True,
        )
        new_remaining = max(0, self.daily_new_limit - new_today_count)
        new_cards = [c for c in candidates if c.state == CardState.NEW][:new_remaining]

        cluster_pool = (
            [c for c in candidates if c.cluster == focus_cluster and c.state != CardState.GRADUATED]
            if focus_cluster
            else []
        )
        if not cluster_pool and candidates:
            clusters = {c.cluster for c in candidates if c.cluster}
            if clusters:
                picked = random.choice(list(clusters))
                cluster_pool = [c for c in candidates if c.cluster == picked]

        refresh = [
            c for c in candidates
            if c.state == CardState.REVIEW and _ensure_utc(c.due) > review_time and c.reps >= 3
        ]

        buckets: dict[str, list[SessionCandidate]] = {
            "due": due,
            "weak": weak,
            "new": new_cards,
            "cluster": cluster_pool,
            "refresh": refresh,
        }

        targets = {k: max(1, int(self.session_size * w)) for k, w in self.BUCKET_WEIGHTS.items()}
        session: list[SessionCandidate] = []
        seen: set[int] = set()

        for bucket_name, target in targets.items():
            pool = buckets[bucket_name]
            random.shuffle(pool)
            added = 0
            for candidate in pool:
                if candidate.card_id in seen:
                    continue
                candidate.bucket = bucket_name
                session.append(candidate)
                seen.add(candidate.card_id)
                added += 1
                if added >= target:
                    break

        remaining = [c for c in candidates if c.card_id not in seen and c.state != CardState.GRADUATED]
        random.shuffle(remaining)
        for candidate in remaining:
            if len(session) >= self.session_size:
                break
            candidate.bucket = "fill"
            session.append(candidate)

        return session[: self.session_size]
