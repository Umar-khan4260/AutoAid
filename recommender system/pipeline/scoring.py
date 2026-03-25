"""
AutoAid Recommender — Scoring & Ranking Module
Dual scoring system: formula-based baseline + Ridge Regression.
Includes cold-start tier interleaving.
"""

import numpy as np
import joblib
import os
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline as SkPipeline

from .features import FEATURE_NAMES, feature_vector_to_array


# ══════════════════════════════════════════════════
# FORMULA-BASED SCORING (always available)
# ══════════════════════════════════════════════════

WEIGHTS = {
    'bayesian_rating': 0.30,
    'distance_score':  0.25,
    'recency_jobs':    0.15,
    'sentiment':       0.15,
    'cancel_score':    0.08,
    'response_score':  0.05,
    'is_online':       0.02,
}


def score_formula(features):
    """
    Score a driver using the weighted formula.
    
    Parameters:
        features: dict with 7 feature values
    
    Returns:
        float score (higher = better)
    """
    return sum(WEIGHTS[k] * features.get(k, 0) for k in WEIGHTS)


# ══════════════════════════════════════════════════
# RIDGE REGRESSION SCORING (when trained)
# ══════════════════════════════════════════════════

class RidgeRanker:
    """Ridge Regression model for driver ranking."""
    
    def __init__(self, model_path=None):
        self.model = None
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), '..', 'training', 'models', 'ridge_ranker.joblib'
        )
    
    def is_trained(self):
        """Check if a trained model is available."""
        return self.model is not None
    
    def train(self, X, y):
        """
        Train Ridge model on feature matrix and labels.
        
        Parameters:
            X: np.ndarray shape (n_samples, 7) — feature vectors
            y: np.ndarray shape (n_samples,) — labels (1.0=hired, 0.0=skipped)
        """
        self.model = SkPipeline([
            ('scaler', StandardScaler()),
            ('ridge', Ridge(alpha=1.0))
        ])
        self.model.fit(X, y)
        
        # Print learned weights
        ridge = self.model.named_steps['ridge']
        scaler = self.model.named_steps['scaler']
        print("\n--- Ridge Regression Learned Weights ---")
        for name, coef, mean, scale in zip(
            FEATURE_NAMES, ridge.coef_, scaler.mean_, scaler.scale_
        ):
            print(f"   {name:20s}: coef={coef:.4f} (mean={mean:.3f}, std={scale:.3f})")
        print(f"   {'intercept':20s}: {ridge.intercept_:.4f}")
        
        return self
    
    def predict(self, features_array):
        """
        Score a single driver.
        
        Parameters:
            features_array: np.ndarray shape (7,) or (n, 7)
        
        Returns:
            float score or np.ndarray of scores
        """
        if not self.is_trained():
            raise RuntimeError("Model not trained. Call train() or load() first.")
        
        if features_array.ndim == 1:
            features_array = features_array.reshape(1, -1)
        
        return self.model.predict(features_array)
    
    def save(self):
        """Save trained model to disk."""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)
        print(f"[SAVED] Ridge model -> {self.model_path}")
    
    def load(self):
        """Load trained model from disk."""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            print(f"[OK] Ridge model loaded from {self.model_path}")
            return True
        return False


# ══════════════════════════════════════════════════
# COLD-START TIER INTERLEAVING
# ══════════════════════════════════════════════════

def get_driver_tier(driver):
    """
    Categorize driver by data availability.
    
    Returns:
        'new'         — no history at all (cold start)
        'emerging'    — sparse history
        'established' — reliable data
    """
    jobs = driver.get('completed_jobs', 0)
    ratings = driver.get('rating_count', 0)
    
    if jobs == 0 and ratings == 0:
        return 'new'
    elif jobs < 5 or ratings < 3:
        return 'emerging'
    else:
        return 'established'


def rank_drivers(drivers, features_list, ridge_model=None, top_n=10):
    """
    Rank drivers with cold-start interleaving.
    
    Strategy:
    - Top 8 slots: best established drivers
    - 1 slot: best emerging driver (gives exposure)
    - 1 slot: random new driver (cold-start injection)
    
    Parameters:
        drivers: list of driver dicts
        features_list: list of feature dicts (parallel to drivers)
        ridge_model: optional RidgeRanker instance
        top_n: number of results to return
    
    Returns:
        list of (driver, score) tuples, ranked
    """
    scored = []
    
    for driver, features in zip(drivers, features_list):
        # Score using Ridge if available, else formula
        if ridge_model and ridge_model.is_trained():
            arr = feature_vector_to_array(features)
            score = float(ridge_model.predict(arr)[0])
        else:
            score = score_formula(features)
        
        tier = get_driver_tier(driver)
        scored.append((driver, score, tier))
    
    # Split by tier
    established = sorted(
        [(d, s) for d, s, t in scored if t == 'established'],
        key=lambda x: -x[1]
    )
    emerging = sorted(
        [(d, s) for d, s, t in scored if t == 'emerging'],
        key=lambda x: -x[1]
    )
    new_drivers = [
        (d, 0.5 + np.random.uniform(0, 0.1))
        for d, s, t in scored if t == 'new'
    ]
    
    # Interleave: mostly established, with exposure slots
    established_slots = max(top_n - 2, 1)
    result = established[:established_slots]
    
    if emerging:
        result.append(emerging[0])  # 1 emerging driver
    if new_drivers:
        # Random new driver for cold-start exploration
        idx = np.random.randint(0, len(new_drivers))
        result.append(new_drivers[idx])
    
    # Fill remaining slots with established if needed
    remaining = top_n - len(result)
    if remaining > 0:
        already_ids = {d.get('driver_id') for d, _ in result}
        extras = [(d, s) for d, s in established if d.get('driver_id') not in already_ids]
        result.extend(extras[:remaining])
    
    return result[:top_n]
