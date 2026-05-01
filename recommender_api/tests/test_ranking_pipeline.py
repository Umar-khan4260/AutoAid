"""
AutoAid — Driver Ranking Pipeline Test Suite
Target Modules: pipeline/features.py + pipeline/scoring.py
Tool: pytest + pytest-cov
Run: pytest tests/test_ranking_pipeline.py --cov=pipeline --cov-report=term-missing -v
"""

import pytest
import numpy as np
from datetime import datetime, timedelta

# ── Imports ──────────────────────────────────────────────────────────────────
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from pipeline.features import (
    haversine,
    bayesian_rating,
    distance_score,
    recency_weighted_jobs,
    sentiment_with_confidence,
    cancel_score,
    response_score,
    build_feature_vector,
    feature_vector_to_array,
    FEATURE_NAMES,
)
from pipeline.scoring import (
    score_formula,
    get_driver_tier,
    WEIGHTS,
)


# ══════════════════════════════════════════════════════════════════════════════
# 1. haversine()
# ══════════════════════════════════════════════════════════════════════════════

class TestHaversine:

    def test_same_point_is_zero(self):
        """Same coordinates → distance must be 0."""
        assert haversine(33.6, 73.0, 33.6, 73.0) == pytest.approx(0.0, abs=1e-6)

    def test_known_distance_lahore_to_islamabad(self):
        """Lahore to Islamabad is approximately 375 km."""
        dist = haversine(33.6844, 73.0479, 31.5204, 74.3587)
        assert 270 < dist < 290

    def test_distance_is_positive(self):
        """Distance between two different points must always be positive."""
        dist = haversine(24.8607, 67.0011, 31.5204, 74.3587)
        assert dist > 0

    def test_distance_is_symmetric(self):
        """haversine(A, B) must equal haversine(B, A)."""
        d1 = haversine(33.6, 73.0, 31.5, 74.3)
        d2 = haversine(31.5, 74.3, 33.6, 73.0)
        assert d1 == pytest.approx(d2, rel=1e-5)

    def test_short_distance(self):
        """Very close coordinates → small but nonzero distance."""
        dist = haversine(33.6000, 73.0000, 33.6001, 73.0001)
        assert 0 < dist < 1


# ══════════════════════════════════════════════════════════════════════════════
# 2. bayesian_rating()
# ══════════════════════════════════════════════════════════════════════════════

class TestBayesianRating:

    def test_zero_ratings_returns_global_mean(self):
        """0 ratings → result must equal the global mean (4.0)."""
        result = bayesian_rating(5.0, 0)
        assert result == pytest.approx(4.0)

    def test_many_ratings_stays_near_actual(self):
        """200 ratings of 4.8 → result must be close to 4.8, not pulled to 4.0."""
        result = bayesian_rating(4.8, 200)
        assert result > 4.7

    def test_sparse_ratings_pulled_toward_mean(self):
        """3 ratings of 5.0 → result pulled significantly toward 4.0."""
        result = bayesian_rating(5.0, 3)
        assert result < 4.8
        assert result > 4.0

    def test_exact_min_ratings_boundary(self):
        """Exactly min_ratings (10) → equal weight between actual and mean."""
        result = bayesian_rating(5.0, 10)
        # (10/20)*5.0 + (10/20)*4.0 = 4.5
        assert result == pytest.approx(4.5)

    def test_below_average_rating(self):
        """Low rating with sufficient count stays below global mean."""
        result = bayesian_rating(2.0, 50)
        assert result < 4.0

    def test_result_between_actual_and_mean(self):
        """Result must always be between the actual rating and global mean."""
        result = bayesian_rating(5.0, 5)
        assert 4.0 <= result <= 5.0


# ══════════════════════════════════════════════════════════════════════════════
# 3. distance_score()
# ══════════════════════════════════════════════════════════════════════════════

class TestDistanceScore:

    def test_zero_distance_is_one(self):
        """0 km away → score must be exactly 1.0."""
        assert distance_score(0) == pytest.approx(1.0)

    def test_score_decreases_with_distance(self):
        """Score at 5km must be less than score at 1km."""
        assert distance_score(5) < distance_score(1)

    def test_score_is_always_positive(self):
        """Score must never reach 0, even at large distances."""
        assert distance_score(100) > 0

    def test_score_never_exceeds_one(self):
        """Score must never exceed 1.0."""
        assert distance_score(0) <= 1.0

    def test_3km_approx(self):
        """At 3km, score should be approximately 0.41 (exp(-0.3*3))."""
        expected = np.exp(-0.3 * 3)
        assert distance_score(3) == pytest.approx(expected, rel=1e-5)

    def test_10km_much_less_than_1km(self):
        """10km driver should score much lower than 1km driver."""
        assert distance_score(10) < distance_score(1) * 0.5


# ══════════════════════════════════════════════════════════════════════════════
# 4. recency_weighted_jobs()
# ══════════════════════════════════════════════════════════════════════════════

class TestRecencyWeightedJobs:

    def test_empty_list_returns_zero(self):
        """No jobs → score must be 0.0."""
        assert recency_weighted_jobs([]) == pytest.approx(0.0)

    def test_none_returns_zero(self):
        """None input → score must be 0.0."""
        assert recency_weighted_jobs(None) == pytest.approx(0.0)

    def test_recent_job_scores_higher_than_old(self):
        """A job done yesterday should score higher than one done 200 days ago."""
        yesterday = [(datetime.now() - timedelta(days=1))]
        old_job = [(datetime.now() - timedelta(days=200))]
        assert recency_weighted_jobs(yesterday) > recency_weighted_jobs(old_job)

    def test_more_recent_jobs_score_higher(self):
        """10 recent jobs should score higher than 1 recent job."""
        one_job = [(datetime.now() - timedelta(days=5))]
        ten_jobs = [(datetime.now() - timedelta(days=5))] * 10
        assert recency_weighted_jobs(ten_jobs) > recency_weighted_jobs(one_job)

    def test_string_date_format_yyyy_mm_dd(self):
        """String timestamps in YYYY-MM-DD format should parse correctly."""
        ts = [(datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")]
        result = recency_weighted_jobs(ts)
        assert result > 0.0

    def test_string_date_format_with_time(self):
        """String timestamps with time should parse correctly."""
        ts = [(datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d %H:%M:%S")]
        result = recency_weighted_jobs(ts)
        assert result > 0.0

    def test_score_is_log_scaled_positive(self):
        """Result must be positive (log1p of positive value)."""
        ts = [datetime.now() - timedelta(days=1)]
        assert recency_weighted_jobs(ts) > 0


# ══════════════════════════════════════════════════════════════════════════════
# 5. sentiment_with_confidence()
# ══════════════════════════════════════════════════════════════════════════════

class TestSentimentWithConfidence:

    def test_zero_reviews_returns_neutral(self):
        """0 reviews → must return 0.5 (neutral prior)."""
        result = sentiment_with_confidence(1.0, 0)
        assert result == pytest.approx(0.5)

    def test_max_reviews_returns_actual_sentiment(self):
        """At max_reviews (20+), result must equal the actual sentiment."""
        result = sentiment_with_confidence(0.9, 20)
        assert result == pytest.approx(0.9)

    def test_partial_confidence_blends_sentiment(self):
        """10 reviews (half of 20) → result is midpoint between actual and 0.5."""
        result = sentiment_with_confidence(1.0, 10)
        # confidence=0.5 → 0.5*1.0 + 0.5*0.5 = 0.75
        assert result == pytest.approx(0.75)

    def test_negative_sentiment_with_full_confidence(self):
        """Negative sentiment with 20+ reviews stays negative."""
        result = sentiment_with_confidence(0.0, 25)
        assert result == pytest.approx(0.0)

    def test_result_always_between_zero_and_one(self):
        """Result must always be between 0.0 and 1.0."""
        for reviews in [0, 1, 5, 10, 20, 50]:
            result = sentiment_with_confidence(0.8, reviews)
            assert 0.0 <= result <= 1.0

    def test_more_reviews_closer_to_actual_sentiment(self):
        """More reviews → result closer to actual raw sentiment."""
        few = sentiment_with_confidence(1.0, 2)
        many = sentiment_with_confidence(1.0, 15)
        assert many > few


# ══════════════════════════════════════════════════════════════════════════════
# 6. cancel_score()
# ══════════════════════════════════════════════════════════════════════════════

class TestCancelScore:

    def test_zero_accepted_jobs_returns_one(self):
        """No accepted jobs → default reliable score of 1.0."""
        assert cancel_score(0, 0) == pytest.approx(1.0)

    def test_no_cancellations_returns_one(self):
        """0 cancellations out of 10 jobs → perfect score 1.0."""
        assert cancel_score(0, 10) == pytest.approx(1.0)

    def test_all_cancelled_returns_zero(self):
        """All jobs cancelled → score must be 0.0."""
        assert cancel_score(10, 10) == pytest.approx(0.0)

    def test_half_cancelled_returns_half(self):
        """5 out of 10 cancelled → score must be 0.5."""
        assert cancel_score(5, 10) == pytest.approx(0.5)

    def test_score_is_between_zero_and_one(self):
        """Score must always be in [0.0, 1.0]."""
        assert 0.0 <= cancel_score(3, 10) <= 1.0

    def test_more_cancellations_lower_score(self):
        """Higher cancellations → lower score."""
        assert cancel_score(7, 10) < cancel_score(2, 10)

    def test_one_cancellation_out_of_100(self):
        """1 cancellation out of 100 → score very close to 1.0."""
        assert cancel_score(1, 100) > 0.98


# ══════════════════════════════════════════════════════════════════════════════
# 7. response_score()
# ══════════════════════════════════════════════════════════════════════════════

class TestResponseScore:

    def test_zero_response_time_is_one(self):
        """0 minute response time → score must be 1.0."""
        assert response_score(0) == pytest.approx(1.0)

    def test_score_decreases_with_time(self):
        """Slower responder must score lower."""
        assert response_score(30) < response_score(5)

    def test_score_always_positive(self):
        """Score never reaches 0."""
        assert response_score(1000) > 0

    def test_score_never_exceeds_one(self):
        """Score must not exceed 1.0."""
        assert response_score(0) <= 1.0

    def test_5_min_approx(self):
        """5-min response → approximately exp(-0.05*5) ≈ 0.778."""
        expected = np.exp(-0.05 * 5)
        assert response_score(5) == pytest.approx(expected, rel=1e-5)


# ══════════════════════════════════════════════════════════════════════════════
# 8. get_driver_tier()  ← LCR MUTANT TARGET
# ══════════════════════════════════════════════════════════════════════════════

class TestGetDriverTier:

    def test_new_driver_zero_jobs_zero_ratings(self):
        """0 jobs AND 0 ratings → must be 'new'."""
        driver = {'completed_jobs': 0, 'rating_count': 0}
        assert get_driver_tier(driver) == 'new'

    def test_zero_jobs_but_has_ratings_is_emerging(self):
        """
        KILLS LCR MUTANT: if 'and' is replaced by 'or':
        - Original (and): jobs==0 AND ratings==0 → only pure zero is 'new'
        - Mutant  (or):   jobs==0 OR  ratings==0 → this case would wrongly be 'new'
        0 jobs but 5 ratings → must be 'emerging', NOT 'new'.
        """
        driver = {'completed_jobs': 0, 'rating_count': 5}
        assert get_driver_tier(driver) == 'emerging'

    def test_has_jobs_but_zero_ratings_is_emerging(self):
        """
        KILLS LCR MUTANT: 3 jobs but 0 ratings.
        - Mutant (or): would wrongly classify as 'new'
        - Original: correctly 'emerging'
        """
        driver = {'completed_jobs': 3, 'rating_count': 0}
        assert get_driver_tier(driver) == 'emerging'

    def test_boundary_4_jobs_is_emerging(self):
        """
        KILLS ROR MUTANT: jobs < 5 boundary.
        4 jobs → must be 'emerging' (not 'established').
        """
        driver = {'completed_jobs': 4, 'rating_count': 10}
        assert get_driver_tier(driver) == 'emerging'

    def test_boundary_5_jobs_3_ratings_is_established(self):
        """
        KILLS ROR MUTANT: exactly at boundary.
        5 jobs AND 3 ratings → must be 'established'.
        """
        driver = {'completed_jobs': 5, 'rating_count': 3}
        assert get_driver_tier(driver) == 'established'

    def test_boundary_2_ratings_is_emerging(self):
        """
        KILLS ROR MUTANT: ratings < 3 boundary.
        10 jobs but only 2 ratings → must be 'emerging'.
        """
        driver = {'completed_jobs': 10, 'rating_count': 2}
        assert get_driver_tier(driver) == 'emerging'

    def test_established_driver(self):
        """Many jobs and ratings → must be 'established'."""
        driver = {'completed_jobs': 50, 'rating_count': 30}
        assert get_driver_tier(driver) == 'established'

    def test_missing_keys_defaults_to_new(self):
        """Missing keys default to 0 → 'new'."""
        assert get_driver_tier({}) == 'new'


# ══════════════════════════════════════════════════════════════════════════════
# 9. score_formula()
# ══════════════════════════════════════════════════════════════════════════════

class TestScoreFormula:

    def _perfect_features(self):
        return {
            'bayesian_rating': 1.0,
            'distance_score':  1.0,
            'recency_jobs':    1.0,
            'sentiment':       1.0,
            'cancel_score':    1.0,
            'response_score':  1.0,
            'is_online':       1.0,
        }

    def _zero_features(self):
        return {k: 0.0 for k in WEIGHTS}

    def test_all_ones_returns_sum_of_weights(self):
        """All features = 1.0 → score equals sum of all weights = 1.0."""
        result = score_formula(self._perfect_features())
        assert result == pytest.approx(sum(WEIGHTS.values()), rel=1e-5)

    def test_all_zeros_returns_zero(self):
        """All features = 0.0 → score must be 0.0."""
        assert score_formula(self._zero_features()) == pytest.approx(0.0)

    def test_missing_key_defaults_to_zero(self):
        """Missing feature key → treated as 0.0 (no crash)."""
        result = score_formula({})
        assert result == pytest.approx(0.0)

    def test_higher_bayesian_rating_increases_score(self):
        """Increasing bayesian_rating must increase total score."""
        low = self._zero_features()
        low['bayesian_rating'] = 0.5
        high = self._zero_features()
        high['bayesian_rating'] = 1.0
        assert score_formula(high) > score_formula(low)

    def test_weights_sum_to_one(self):
        """All WEIGHTS must sum to exactly 1.0 (sanity check)."""
        assert sum(WEIGHTS.values()) == pytest.approx(1.0, abs=1e-6)

    def test_distance_score_has_second_highest_weight(self):
        """distance_score weight (0.25) must be second after bayesian_rating (0.30)."""
        sorted_weights = sorted(WEIGHTS.values(), reverse=True)
        assert sorted_weights[1] == pytest.approx(0.25)

    def test_score_is_weighted_linear_combination(self):
        """Manual calculation must match function output."""
        features = {
            'bayesian_rating': 0.8,
            'distance_score':  0.6,
            'recency_jobs':    0.5,
            'sentiment':       0.7,
            'cancel_score':    0.9,
            'response_score':  0.4,
            'is_online':       1.0,
        }
        expected = sum(WEIGHTS[k] * features[k] for k in WEIGHTS)
        assert score_formula(features) == pytest.approx(expected, rel=1e-5)


# ══════════════════════════════════════════════════════════════════════════════
# 10. build_feature_vector() — Integration
# ══════════════════════════════════════════════════════════════════════════════

class TestBuildFeatureVector:

    def _sample_driver(self):
        return {
            'avg_rating': 4.5,
            'rating_count': 20,
            'lat': 33.62,
            'lon': 73.06,
            'job_timestamps': [datetime.now() - timedelta(days=10)],
            'cancellations': 1,
            'accepted_jobs': 20,
            'avg_response_time_min': 5,
            'is_online': True,
        }

    def test_returns_all_seven_features(self):
        """build_feature_vector must return a dict with all 7 feature keys."""
        fv = build_feature_vector(self._sample_driver(), 33.60, 73.04)
        assert set(fv.keys()) == set(FEATURE_NAMES)

    def test_online_driver_has_is_online_one(self):
        """is_online=True driver → feature value must be 1.0."""
        fv = build_feature_vector(self._sample_driver(), 33.60, 73.04)
        assert fv['is_online'] == pytest.approx(1.0)

    def test_offline_driver_has_is_online_zero(self):
        """is_online=False driver → feature value must be 0.0."""
        driver = self._sample_driver()
        driver['is_online'] = False
        fv = build_feature_vector(driver, 33.60, 73.04)
        assert fv['is_online'] == pytest.approx(0.0)

    def test_all_features_are_non_negative(self):
        """All feature values must be >= 0."""
        fv = build_feature_vector(self._sample_driver(), 33.60, 73.04)
        for key, val in fv.items():
            assert val >= 0.0, f"{key} is negative: {val}"

    def test_no_sentiment_defaults_to_neutral(self):
        """No pre-computed sentiment → sentiment feature defaults to 0.5 (neutral)."""
        fv = build_feature_vector(self._sample_driver(), 33.60, 73.04, sentiment_score=None)
        assert fv['sentiment'] == pytest.approx(0.5)


# ══════════════════════════════════════════════════════════════════════════════
# 11. feature_vector_to_array()
# ══════════════════════════════════════════════════════════════════════════════

class TestFeatureVectorToArray:

    def test_returns_numpy_array(self):
        """Output must be a numpy array."""
        features = {k: 0.5 for k in FEATURE_NAMES}
        result = feature_vector_to_array(features)
        assert isinstance(result, np.ndarray)

    def test_correct_length(self):
        """Array must have 7 elements."""
        features = {k: 0.5 for k in FEATURE_NAMES}
        assert len(feature_vector_to_array(features)) == 7

    def test_correct_order(self):
        """Values must follow FEATURE_NAMES order exactly."""
        features = {name: float(i) for i, name in enumerate(FEATURE_NAMES)}
        arr = feature_vector_to_array(features)
        for i, name in enumerate(FEATURE_NAMES):
            assert arr[i] == pytest.approx(float(i))
