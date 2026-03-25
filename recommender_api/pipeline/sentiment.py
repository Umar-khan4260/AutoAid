"""
AutoAid Recommender — NLP Sentiment Engine
Uses Cardiff RoBERTa for sentiment analysis with sparse review guard.
Pre-computes and caches sentiment scores for all drivers.
"""

import numpy as np

# ── Try to load the HuggingFace model ──
# Falls back to a rule-based approach if transformers not installed
try:
    from transformers import pipeline as hf_pipeline
    
    _sentiment_pipeline = None
    
    def _get_pipeline():
        """Lazy-load the model (only once, on first call)."""
        global _sentiment_pipeline
        if _sentiment_pipeline is None:
            print("[*] Loading Cardiff RoBERTa sentiment model...")
            _sentiment_pipeline = hf_pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment",
                truncation=True,
                max_length=128
            )
            print("[OK] Sentiment model loaded successfully")
        return _sentiment_pipeline
    
    LABEL_MAP = {"LABEL_0": 0.0, "LABEL_1": 0.5, "LABEL_2": 1.0}
    HAS_TRANSFORMERS = True

except ImportError:
    HAS_TRANSFORMERS = False
    print("[WARN] transformers not installed. Using rule-based sentiment fallback.")


def _rule_based_sentiment(review_text):
    """
    Simple keyword-based sentiment scorer as fallback.
    Returns 0.0 (negative), 0.5 (neutral), or 1.0 (positive).
    """
    text = review_text.lower()
    
    positive_words = [
        'excellent', 'great', 'best', 'professional', 'safe', 'punctual',
        'reliable', 'smooth', 'careful', 'polite', 'recommend', 'trust',
        'perfect', 'amazing', 'superb', 'comfortable', 'honest', 'impressed',
        'lifesaver', 'disciplined', 'skilled', 'experienced', 'impressive',
        '5 stars', 'five stars', 'top class', 'bhai', 'highly'
    ]
    
    negative_words = [
        'late', 'rude', 'reckless', 'dangerous', 'rash', 'scared', 'unsafe',
        'unprofessional', 'cancelled', 'overcharged', 'terrible', 'worst',
        'careless', 'dishonest', 'aggressive', 'slow', 'lost', 'scratches',
        'argued', 'never again', 'poor', 'bad', 'horrible', 'rough'
    ]
    
    pos_count = sum(1 for w in positive_words if w in text)
    neg_count = sum(1 for w in negative_words if w in text)
    
    if pos_count > neg_count:
        return 1.0
    elif neg_count > pos_count:
        return 0.0
    else:
        return 0.5


def compute_sentiment(reviews, min_reviews=3):
    """
    Compute sentiment score for a list of reviews.
    
    Parameters:
        reviews: list of review text strings
        min_reviews: skip NLP if fewer reviews than this
    
    Returns:
        (sentiment_score, confidence)
        - sentiment_score: 0.0 (negative) to 1.0 (positive)
        - confidence: 0.0 to 1.0 based on review count
    """
    if not reviews or len(reviews) < min_reviews:
        # Not enough reviews → return neutral with low confidence
        count = len(reviews) if reviews else 0
        return 0.5, count / 20.0
    
    # Cap at 10 most recent reviews for speed
    sample = reviews[-10:]
    
    if HAS_TRANSFORMERS:
        # Use Cardiff RoBERTa
        pipe = _get_pipeline()
        try:
            results = pipe(sample)
            scores = [LABEL_MAP.get(r['label'], 0.5) for r in results]
        except Exception as e:
            print(f"[WARN] RoBERTa failed: {e}. Using rule-based fallback.")
            scores = [_rule_based_sentiment(r) for r in sample]
    else:
        # Rule-based fallback
        scores = [_rule_based_sentiment(r) for r in sample]
    
    confidence = min(len(reviews) / 20.0, 1.0)
    return float(np.mean(scores)), confidence


def batch_compute_sentiments(drivers_data):
    """
    Pre-compute sentiment scores for all drivers.
    
    Parameters:
        drivers_data: list of dicts, each with 'driver_id' and 'reviews'
    
    Returns:
        dict: {driver_id: (sentiment_score, confidence)}
    """
    results = {}
    total = len(drivers_data)
    
    for i, driver in enumerate(drivers_data):
        driver_id = driver['driver_id']
        reviews = driver.get('reviews', [])
        
        score, confidence = compute_sentiment(reviews)
        results[driver_id] = (score, confidence)
        
        if (i + 1) % 100 == 0:
            print(f"    Sentiment: {i+1}/{total} drivers processed...")
    
    print(f"[OK] Computed sentiments for {total} drivers")
    return results
