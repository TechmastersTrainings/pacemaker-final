"""
Rule-Based Rank Prediction Engine
- Weighted subject scoring
- Percentile calculation against a benchmark distribution
- Rank range estimation
- Performance band classification
- Weak subject detection
"""
from __future__ import annotations

import math
from dataclasses import dataclass

# ── Subject weights (must sum to 1.0) ────────────────────────────────────────
SUBJECT_WEIGHTS: dict[str, float] = {
    "pathology":     0.20,
    "pharmacology":  0.18,
    "physiology":    0.17,
    "anatomy":       0.15,
    "biochemistry":  0.15,
    "microbiology":  0.15,
}

# ── Performance bands ─────────────────────────────────────────────────────────
PERFORMANCE_BANDS = [
    (90, 100, "Outstanding"),
    (80,  90, "Excellent"),
    (70,  80, "Good"),
    (60,  70, "Average"),
    (50,  60, "Below Average"),
    (0,   50, "Needs Improvement"),
]

# ── Benchmark rank table (percentile → rank out of 50,000) ───────────────────
# Maps weighted-score range → (min_rank, max_rank)
RANK_TABLE = [
    (95, 100, 1,      500),
    (90,  95, 500,   1500),
    (85,  90, 1500,  3000),
    (80,  85, 3000,  5000),
    (75,  80, 5000,  8000),
    (70,  75, 8000, 12000),
    (65,  70, 12000, 18000),
    (60,  65, 18000, 25000),
    (50,  60, 25000, 35000),
    (0,   50, 35000, 50000),
]


@dataclass
class RuleBasedResult:
    weighted_score: float
    percentile: float
    predicted_rank_min: int
    predicted_rank_max: int
    performance_band: str
    weak_subjects: list[str]
    strong_subjects: list[str]
    subject_breakdown: dict[str, dict]


def compute_weighted_score(scores: dict[str, float]) -> float:
    """
    Compute weighted average across all provided subjects.
    Subjects not in SUBJECT_WEIGHTS are averaged with equal weight.
    """
    known, unknown = {}, {}
    for subj, score in scores.items():
        key = subj.lower().strip()
        if key in SUBJECT_WEIGHTS:
            known[key] = score
        else:
            unknown[key] = score

    total_weight = 0.0
    weighted_sum = 0.0

    for subj, score in known.items():
        w = SUBJECT_WEIGHTS[subj]
        weighted_sum += score * w
        total_weight += w

    # Fill remaining weight equally with unknown subjects
    remaining_weight = 1.0 - total_weight
    if unknown and remaining_weight > 0:
        per_unknown = remaining_weight / len(unknown)
        for score in unknown.values():
            weighted_sum += score * per_unknown

    # If not all known subjects provided, normalise
    if total_weight > 0 and total_weight < 1.0 and not unknown:
        weighted_sum = weighted_sum / total_weight * 1.0

    return round(min(weighted_sum, 100.0), 2)


def score_to_percentile(weighted_score: float, mock_rank: int | None,
                         total_students: int) -> float:
    """
    Combine weighted score percentile with mock rank percentile (if provided).
    """
    score_pct = weighted_score  # score out of 100 ≈ percentile

    if mock_rank and total_students and mock_rank > 0:
        rank_pct = round((1 - mock_rank / total_students) * 100, 2)
        # Blend 70% score, 30% mock rank
        combined = 0.70 * score_pct + 0.30 * rank_pct
    else:
        combined = score_pct

    return round(min(max(combined, 0.0), 99.9), 2)


def percentile_to_rank_range(percentile: float) -> tuple[int, int]:
    for lo, hi, rmin, rmax in RANK_TABLE:
        if lo <= percentile < hi:
            # Interpolate within the band
            fraction = (percentile - lo) / (hi - lo) if hi != lo else 0.5
            span = rmax - rmin
            mid = rmin + int(span * (1 - fraction))
            margin = max(int(span * 0.2), 200)
            return max(1, mid - margin), mid + margin
    return 40000, 50000


def get_performance_band(score: float) -> str:
    for lo, hi, band in PERFORMANCE_BANDS:
        if lo <= score < hi:
            return band
    return "Outstanding"


def get_weak_strong(scores: dict[str, float],
                    threshold_weak: float = 70.0,
                    threshold_strong: float = 85.0) -> tuple[list[str], list[str]]:
    weak   = [s for s, v in scores.items() if v < threshold_weak]
    strong = [s for s, v in scores.items() if v >= threshold_strong]
    return weak, strong


def run_rule_engine(
    scores: dict[str, float],
    mock_rank: int | None = None,
    total_students: int = 50000,
) -> RuleBasedResult:
    """
    Main entry point for rule-based prediction.
    Returns a fully populated RuleBasedResult.
    """
    weighted_score = compute_weighted_score(scores)
    percentile     = score_to_percentile(weighted_score, mock_rank, total_students)
    rank_min, rank_max = percentile_to_rank_range(percentile)
    band           = get_performance_band(weighted_score)
    weak, strong   = get_weak_strong(scores)

    # Per-subject breakdown
    breakdown = {}
    for subj, score in scores.items():
        key = subj.lower().strip()
        weight = SUBJECT_WEIGHTS.get(key, None)
        breakdown[subj] = {
            "score":      score,
            "weight_pct": round(weight * 100, 0) if weight else "N/A",
            "status":     "Strong" if score >= 85 else ("Weak" if score < 70 else "Average"),
        }

    return RuleBasedResult(
        weighted_score=weighted_score,
        percentile=percentile,
        predicted_rank_min=rank_min,
        predicted_rank_max=rank_max,
        performance_band=band,
        weak_subjects=weak,
        strong_subjects=strong,
        subject_breakdown=breakdown,
    )
