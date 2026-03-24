"""
AutoAid Recommender — Feature Engineering Pipeline
Computes the 7-dimensional feature vector for each driver.
"""

import numpy as np
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime


def haversine(lat1, lon1, lat2, lon2):
    """Distance in km between two GPS coordinates."""
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def bayesian_rating(avg_rating, rating_count, global_mean=4.0, min_ratings=10):
    """
    Confidence-adjusted rating using Bayesian average.
    Pulls sparse ratings toward the global mean.
    
    - A driver with 3 ratings of 5.0 → pulled toward 4.0
    - A driver with 200 ratings of 4.5 → stays near 4.5
    """
    n = rating_count
    r = avg_rating
    C = global_mean
    m = min_ratings
    return (n / (n + m)) * r + (m / (n + m)) * C


def distance_score(d_km, decay_rate=0.3):
    """
    Exponential decay — nearby drivers score high, distant ones fall off.
    
    d=0km  → score=1.0
    d=3km  → score=0.41
    d=10km → score=0.05
    """
    return np.exp(-decay_rate * d_km)


def recency_weighted_jobs(job_timestamps, decay_days=90):
    """
    Recent jobs weighted higher than old ones using exponential decay.
    Log-scaled to prevent dominant outliers.
    
    A driver with 40 jobs last month > a driver with 200 jobs 2 years ago.
    """
    if not job_timestamps:
        return 0.0
    
    now = datetime.now()
    score = 0.0
    for ts in job_timestamps:
        if isinstance(ts, str):
            try:
                ts = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                try:
                    ts = datetime.strptime(ts, "%Y-%m-%d")
                except ValueError:
                    continue
        days_ago = max((now - ts).days, 0)
        score += np.exp(-days_ago / decay_days)
    
    return np.log1p(score)


def sentiment_with_confidence(raw_sentiment, review_count, max_reviews=20):
    """
    Blends actual NLP sentiment with a neutral prior based on data confidence.
    
    - 0 reviews → returns 0.5 (neutral)
    - 5 reviews → 75% actual + 25% neutral
    - 20+ reviews → 100% actual sentiment
    """
    confidence = min(review_count / max_reviews, 1.0)
    neutral_prior = 0.5
    return confidence * raw_sentiment + (1 - confidence) * neutral_prior


def cancel_score(cancellations, accepted_jobs):
    """Reliability score: 1.0 = never cancels, 0.0 = always cancels."""
    if accepted_jobs == 0:
        return 1.0
    cancel_rate = cancellations / max(accepted_jobs, 1)
    return 1.0 - cancel_rate


def response_score(avg_response_time_min, decay_rate=0.05):
    """
    Exponential decay on response time.
    Fast responders score high.
    
    5 min → 0.78
    15 min → 0.47
    30 min → 0.22
    """
    return np.exp(-decay_rate * avg_response_time_min)


def build_feature_vector(driver, user_lat, user_lon, sentiment_score=None, review_count=None):
    """
    Assembles the complete 7-dimensional feature vector for a driver.
    
    Parameters:
        driver: dict with driver profile data
        user_lat, user_lon: user's current GPS coordinates
        sentiment_score: pre-computed NLP sentiment (0.0-1.0), or None
        review_count: number of reviews, used for confidence weighting
    
    Returns:
        dict with 7 features, all in [0, ~5] range
    """
    # 1. Bayesian Rating
    bay_rating = bayesian_rating(
        driver.get('avg_rating', 4.0),
        driver.get('rating_count', 0)
    )
    
    # 2. Distance Score (exponential decay)
    d_km = haversine(user_lat, user_lon, driver['lat'], driver['lon'])
    dist = distance_score(d_km)
    
    # 3. Recency-Weighted Jobs
    job_ts = driver.get('job_timestamps', [])
    recency = recency_weighted_jobs(job_ts)
    
    # 4. Sentiment with Confidence
    if sentiment_score is not None:
        r_count = review_count if review_count is not None else 0
    else:
        # Default: neutral if no sentiment pre-computed
        sentiment_score = 0.5
        r_count = 0
    sentiment = sentiment_with_confidence(sentiment_score, r_count)
    
    # 5. Cancel Score (reliability)
    c_score = cancel_score(
        driver.get('cancellations', 0),
        driver.get('accepted_jobs', 1)
    )
    
    # 6. Response Score
    r_score = response_score(driver.get('avg_response_time_min', 30))
    
    # 7. Online Status
    is_online = float(driver.get('is_online', False))
    
    return {
        'bayesian_rating': bay_rating,
        'distance_score': dist,
        'recency_jobs': recency,
        'sentiment': sentiment,
        'cancel_score': c_score,
        'response_score': r_score,
        'is_online': is_online,
    }


# Feature names in order (used by scoring module)
FEATURE_NAMES = [
    'bayesian_rating', 'distance_score', 'recency_jobs',
    'sentiment', 'cancel_score', 'response_score', 'is_online'
]


def feature_vector_to_array(features):
    """Convert feature dict to numpy array in consistent order."""
    return np.array([features[k] for k in FEATURE_NAMES])
