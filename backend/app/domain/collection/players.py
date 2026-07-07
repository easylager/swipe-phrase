"""England squad collection — unlock rules tied to real learning behaviour."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

UnlockMetric = Literal[
    "matchdays_played",
    "matchday_wins",
    "unbeaten_run",
    "total_reviews",
    "graduated_words",
    "vocabulary_size",
    "best_combo_ever",
    "high_accuracy_wins",
    "squad_unlocked",
]

PlayerEra = Literal["current", "golden", "legend"]
PlayerRarity = Literal["common", "rare", "icon"]

WC2026_SQUAD_SIZE = 26


@dataclass(frozen=True, slots=True)
class PlayerDefinition:
    id: str
    name: str
    full_name: str
    position: str
    number: int
    era: PlayerEra
    rarity: PlayerRarity
    metric: UnlockMetric
    target: int
    unlock_hint: str
    moment: str


PLAYERS: tuple[PlayerDefinition, ...] = (
    # — FIFA World Cup 2026 — Thomas Tuchel's 26 (May 2026) —
    # Goalkeepers
    PlayerDefinition(
        id="pickford",
        name="Pickford",
        full_name="Jordan Pickford",
        position="GK",
        number=1,
        era="current",
        rarity="common",
        metric="matchdays_played",
        target=1,
        unlock_hint="Сыграй полный матчд — 25 карточек за день",
        moment="«Safe hands when it matters.»",
    ),
    PlayerDefinition(
        id="henderson_d",
        name="D. Henderson",
        full_name="Dean Henderson",
        position="GK",
        number=13,
        era="current",
        rarity="common",
        metric="matchday_wins",
        target=2,
        unlock_hint="2 победных матчда",
        moment="«Palace wall — your second clean sheet.»",
    ),
    PlayerDefinition(
        id="trafford",
        name="Trafford",
        full_name="James Trafford",
        position="GK",
        number=22,
        era="current",
        rarity="common",
        metric="vocabulary_size",
        target=15,
        unlock_hint="15 фраз в словаре",
        moment="«Young keeper — growing word list.»",
    ),
    # Defenders
    PlayerDefinition(
        id="stones",
        name="Stones",
        full_name="John Stones",
        position="CB",
        number=5,
        era="current",
        rarity="rare",
        metric="high_accuracy_wins",
        target=1,
        unlock_hint="Победа с точностью 80%+ — чистый матч",
        moment="«Calm on the ball, calm under pressure.»",
    ),
    PlayerDefinition(
        id="guehi",
        name="Guehi",
        full_name="Marc Guehi",
        position="CB",
        number=6,
        era="current",
        rarity="rare",
        metric="graduated_words",
        target=8,
        unlock_hint="8 слов переведи в статус «выучено»",
        moment="«Captain's composure at the back.»",
    ),
    PlayerDefinition(
        id="konsa",
        name="Konsa",
        full_name="Ezri Konsa",
        position="CB",
        number=14,
        era="current",
        rarity="rare",
        metric="unbeaten_run",
        target=5,
        unlock_hint="5 победных матчдов подряд",
        moment="«Villa rock — five wins on the bounce.»",
    ),
    PlayerDefinition(
        id="burn",
        name="Burn",
        full_name="Dan Burn",
        position="CB",
        number=33,
        era="current",
        rarity="rare",
        metric="total_reviews",
        target=250,
        unlock_hint="250 повторений — трудяга обороны",
        moment="«Heads everything — reviews everything.»",
    ),
    PlayerDefinition(
        id="quansah",
        name="Quansah",
        full_name="Jarell Quansah",
        position="CB",
        number=15,
        era="current",
        rarity="rare",
        metric="graduated_words",
        target=12,
        unlock_hint="12 слов выучено наизусть",
        moment="«Breakthrough season, breakthrough recall.»",
    ),
    PlayerDefinition(
        id="reece_james",
        name="R. James",
        full_name="Reece James",
        position="RB",
        number=24,
        era="current",
        rarity="rare",
        metric="best_combo_ever",
        target=12,
        unlock_hint="Комбо 12+ «Выучил» подряд за день",
        moment="«Captain's armband energy down the right.»",
    ),
    PlayerDefinition(
        id="chalobah",
        name="Chalobah",
        full_name="Trevoh Chalobah",
        position="CB",
        number=23,
        era="current",
        rarity="rare",
        metric="matchdays_played",
        target=7,
        unlock_hint="7 сыгранных матчдов",
        moment="«Chelsea wall — seven days of graft.»",
    ),
    PlayerDefinition(
        id="oreilly",
        name="O'Reilly",
        full_name="Nico O'Reilly",
        position="LB",
        number=25,
        era="current",
        rarity="rare",
        metric="matchday_wins",
        target=4,
        unlock_hint="4 победных матчда",
        moment="«City academy graduate on the plane.»",
    ),
    PlayerDefinition(
        id="spence",
        name="Spence",
        full_name="Djed Spence",
        position="LB",
        number=2,
        era="current",
        rarity="rare",
        metric="total_reviews",
        target=350,
        unlock_hint="350 повторений",
        moment="«Surprise call-up — surprise streak.»",
    ),
    # Midfielders
    PlayerDefinition(
        id="rice",
        name="Rice",
        full_name="Declan Rice",
        position="CDM",
        number=4,
        era="current",
        rarity="rare",
        metric="unbeaten_run",
        target=3,
        unlock_hint="3 победных матчда подряд",
        moment="«Shields the back line — shields your streak.»",
    ),
    PlayerDefinition(
        id="bellingham",
        name="Bellingham",
        full_name="Jude Bellingham",
        position="CM",
        number=10,
        era="current",
        rarity="rare",
        metric="total_reviews",
        target=100,
        unlock_hint="100 повторений — войди в ритм сезона",
        moment="«Box-to-box energy, every single session.»",
    ),
    PlayerDefinition(
        id="mainoo",
        name="Mainoo",
        full_name="Kobbie Mainoo",
        position="CM",
        number=26,
        era="current",
        rarity="rare",
        metric="best_combo_ever",
        target=20,
        unlock_hint="Комбо 20+ за день",
        moment="«Composed beyond his years.»",
    ),
    PlayerDefinition(
        id="henderson_j",
        name="J. Henderson",
        full_name="Jordan Henderson",
        position="CM",
        number=8,
        era="current",
        rarity="rare",
        metric="matchdays_played",
        target=10,
        unlock_hint="10 сыгранных матчдов",
        moment="«Veteran presence — veteran consistency.»",
    ),
    PlayerDefinition(
        id="anderson",
        name="Anderson",
        full_name="Elliot Anderson",
        position="CM",
        number=32,
        era="current",
        rarity="rare",
        metric="total_reviews",
        target=200,
        unlock_hint="200 повторений",
        moment="«Forest engine — mid-season grind.»",
    ),
    PlayerDefinition(
        id="eze",
        name="Eze",
        full_name="Eberechi Eze",
        position="AM",
        number=16,
        era="current",
        rarity="icon",
        metric="matchday_wins",
        target=3,
        unlock_hint="3 победных матчда",
        moment="«Silky feet — silky phrases.»",
    ),
    PlayerDefinition(
        id="rogers",
        name="Rogers",
        full_name="Morgan Rogers",
        position="AM",
        number=27,
        era="current",
        rarity="icon",
        metric="vocabulary_size",
        target=30,
        unlock_hint="30 фраз в словаре",
        moment="«Breakout star — breakout vocabulary.»",
    ),
    # Forwards
    PlayerDefinition(
        id="kane",
        name="Kane",
        full_name="Harry Kane",
        position="ST",
        number=9,
        era="current",
        rarity="icon",
        metric="matchday_wins",
        target=7,
        unlock_hint="7 победных матчдов — капитанский уровень",
        moment="«England's all-time scorer — your all-time effort.»",
    ),
    PlayerDefinition(
        id="saka",
        name="Saka",
        full_name="Bukayo Saka",
        position="RW",
        number=7,
        era="current",
        rarity="icon",
        metric="matchday_wins",
        target=1,
        unlock_hint="Выиграй матчд: 25 карточек и 65%+ точность",
        moment="«Started on the left, ended up everywhere.»",
    ),
    PlayerDefinition(
        id="rashford",
        name="Rashford",
        full_name="Marcus Rashford",
        position="LW",
        number=11,
        era="current",
        rarity="icon",
        metric="best_combo_ever",
        target=15,
        unlock_hint="Комбо 15+ «Выучил» подряд",
        moment="«Pace and power — streak and power.»",
    ),
    PlayerDefinition(
        id="gordon",
        name="Gordon",
        full_name="Anthony Gordon",
        position="LW",
        number=18,
        era="current",
        rarity="icon",
        metric="high_accuracy_wins",
        target=3,
        unlock_hint="3 победы с точностью 80%+",
        moment="«Direct running — direct recall.»",
    ),
    PlayerDefinition(
        id="madueke",
        name="Madueke",
        full_name="Noni Madueke",
        position="RW",
        number=20,
        era="current",
        rarity="icon",
        metric="unbeaten_run",
        target=4,
        unlock_hint="4 победных дня подряд",
        moment="«Tricky winger — tricky streak.»",
    ),
    PlayerDefinition(
        id="watkins",
        name="Watkins",
        full_name="Ollie Watkins",
        position="ST",
        number=19,
        era="current",
        rarity="icon",
        metric="total_reviews",
        target=500,
        unlock_hint="500 повторений — полный сезон",
        moment="«Late runs into the box — late-night sessions.»",
    ),
    PlayerDefinition(
        id="toney",
        name="Toney",
        full_name="Ivan Toney",
        position="ST",
        number=17,
        era="current",
        rarity="icon",
        metric="unbeaten_run",
        target=7,
        unlock_hint="7 победных дней подряд",
        moment="«Penalty king — streak king.»",
    ),
    # — Legends hall (bonus beyond WC squad) —
    PlayerDefinition(
        id="rooney",
        name="Rooney",
        full_name="Wayne Rooney",
        position="ST",
        number=10,
        era="legend",
        rarity="icon",
        metric="graduated_words",
        target=40,
        unlock_hint="40 слов выучено — зал славы",
        moment="«That overhead kick — that overhead effort.»",
    ),
    PlayerDefinition(
        id="beckham",
        name="Beckham",
        full_name="David Beckham",
        position="RM",
        number=7,
        era="legend",
        rarity="icon",
        metric="best_combo_ever",
        target=30,
        unlock_hint="Комбо 30+ — точность как у свободного",
        moment="«Bend it like Beckham — bend your streak.»",
    ),
    PlayerDefinition(
        id="gerrard",
        name="Gerrard",
        full_name="Steven Gerrard",
        position="CM",
        number=8,
        era="legend",
        rarity="icon",
        metric="matchday_wins",
        target=25,
        unlock_hint="25 победных матчдов",
        moment="«Slip? Never. Not on your watch.»",
    ),
    PlayerDefinition(
        id="shearer",
        name="Shearer",
        full_name="Alan Shearer",
        position="ST",
        number=9,
        era="legend",
        rarity="icon",
        metric="total_reviews",
        target=1500,
        unlock_hint="1500 повторений — рекордсмен",
        moment="«Premier League legend — phrase league legend.»",
    ),
    PlayerDefinition(
        id="lineker",
        name="Lineker",
        full_name="Gary Lineker",
        position="ST",
        number=10,
        era="legend",
        rarity="icon",
        metric="unbeaten_run",
        target=14,
        unlock_hint="14 победных дней подряд",
        moment="«Never booked — never broken streak.»",
    ),
    PlayerDefinition(
        id="charlton",
        name="Charlton",
        full_name="Sir Bobby Charlton",
        position="CM",
        number=9,
        era="legend",
        rarity="icon",
        metric="graduated_words",
        target=100,
        unlock_hint="100 слов выучено — Wembley awaits",
        moment="«Sir Bobby — the ultimate England icon.»",
    ),
    PlayerDefinition(
        id="gascoigne",
        name="Gascoigne",
        full_name="Paul Gascoigne",
        position="AM",
        number=8,
        era="golden",
        rarity="icon",
        metric="squad_unlocked",
        target=22,
        unlock_hint=f"Собери {22} из {WC2026_SQUAD_SIZE} игроков ЧМ-2026",
        moment="«Pure magic. Pure unpredictability.»",
    ),
)


def _metric_value(metrics: dict[str, int | float], metric: UnlockMetric) -> int | float:
    return metrics.get(metric, 0)


def _count_wc2026_unlocked(items: list[dict]) -> int:
    return sum(1 for p in items if p["era"] == "current" and p["unlocked"])


def evaluate_player(
    player: PlayerDefinition,
    metrics: dict[str, int | float],
    *,
    wc2026_unlocked: int,
) -> dict:
    current = _metric_value(metrics, player.metric)
    if player.metric == "squad_unlocked":
        current = wc2026_unlocked
    target = player.target
    unlocked = int(current) >= target
    progress = min(100.0, round((float(current) / target) * 100, 1)) if target > 0 else 100.0
    return {
        "id": player.id,
        "name": player.name,
        "full_name": player.full_name,
        "position": player.position,
        "number": player.number,
        "era": player.era,
        "rarity": player.rarity,
        "metric": player.metric,
        "target": target,
        "current": int(current),
        "progress": progress if not unlocked else 100.0,
        "unlocked": unlocked,
        "unlock_hint": player.unlock_hint,
        "moment": player.moment,
    }


def build_collection(metrics: dict[str, int | float]) -> dict:
    # First pass without squad_unlocked metric
    provisional = [
        evaluate_player(p, metrics, wc2026_unlocked=0)
        for p in PLAYERS
        if p.metric != "squad_unlocked"
    ]
    wc2026_unlocked = _count_wc2026_unlocked(provisional)

    items = [evaluate_player(p, metrics, wc2026_unlocked=wc2026_unlocked) for p in PLAYERS]
    unlocked = [p for p in items if p["unlocked"]]
    locked = [p for p in items if not p["unlocked"]]

    next_unlock = None
    if locked:
        candidates = sorted(
            locked,
            key=lambda p: (-p["progress"], p["target"] - p["current"], p["name"]),
        )
        next_unlock = candidates[0]

    return {
        "total": len(items),
        "unlocked_count": len(unlocked),
        "wc2026_total": WC2026_SQUAD_SIZE,
        "wc2026_unlocked": wc2026_unlocked,
        "players": items,
        "next_unlock": next_unlock,
    }
