"""
AutoAid Recommender — Full Training Pipeline
Ties together: data loading, sentiment pre-computation, feature engineering,
and Ridge Regression training. Evaluates and saves the trained model.
"""

import sys
import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, ndcg_score

# Add parent dir to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from pipeline.features import build_feature_vector, feature_vector_to_array, FEATURE_NAMES
from pipeline.sentiment import compute_sentiment, batch_compute_sentiments
from pipeline.scoring import score_formula, RidgeRanker, WEIGHTS


def load_data():
    """Load merged drivers and interactions."""
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    
    print("[*] Loading merged drivers...")
    drivers_df = pd.read_csv(os.path.join(data_dir, 'drivers_merged.csv'))
    drivers_df['reviews'] = drivers_df['reviews'].apply(json.loads)
    drivers_df['job_timestamps'] = drivers_df['job_timestamps'].apply(json.loads)
    print(f"    {len(drivers_df)} drivers loaded")
    
    print("[*] Loading interactions...")
    interactions_df = pd.read_csv(os.path.join(data_dir, 'interactions.csv'))
    print(f"    {len(interactions_df)} interactions loaded")
    
    # Create driver lookup
    drivers_dict = {}
    for _, row in drivers_df.iterrows():
        drivers_dict[row['driver_id']] = row.to_dict()
    
    return drivers_df, interactions_df, drivers_dict


def precompute_sentiments(drivers_df):
    """Pre-compute sentiment for all drivers."""
    print("\n[*] Pre-computing sentiment scores...")
    drivers_list = drivers_df.to_dict('records')
    sentiment_cache = batch_compute_sentiments(drivers_list)
    
    # Stats
    scores = [s for s, c in sentiment_cache.values()]
    print(f"    Mean sentiment: {np.mean(scores):.3f}")
    print(f"    Positive (>0.6): {sum(1 for s in scores if s > 0.6)}")
    print(f"    Neutral (0.4-0.6): {sum(1 for s in scores if 0.4 <= s <= 0.6)}")
    print(f"    Negative (<0.4): {sum(1 for s in scores if s < 0.4)}")
    
    return sentiment_cache


def build_training_data(interactions_df, drivers_dict, sentiment_cache):
    """
    Build feature matrix (X) and labels (y) from interaction data.
    
    Label strategy:
    - hired = 1.0
    - shown but not hired = penalized by rank position
    """
    print("\n[*] Building training data...")
    X = []
    y = []
    skipped = 0
    
    for _, row in interactions_df.iterrows():
        provider_id = row['provider_id']
        
        if provider_id not in drivers_dict:
            skipped += 1
            continue
        
        driver = drivers_dict[provider_id]
        
        # Get sentiment from cache
        sent_score, sent_confidence = sentiment_cache.get(
            provider_id, (0.5, 0.0)
        )
        review_count = len(driver.get('reviews', []))
        
        # Build feature vector
        features = build_feature_vector(
            driver,
            user_lat=row['user_lat'],
            user_lon=row['user_lon'],
            sentiment_score=sent_score,
            review_count=review_count
        )
        
        X.append(feature_vector_to_array(features))
        
        # Label: hired=1.0, shown but skipped penalized by rank
        if row['was_hired']:
            label = 1.0
        else:
            label = max(0.0, 1.0 - row['shown_rank'] * 0.1)
        y.append(label)
    
    X = np.array(X)
    y = np.array(y)
    
    if skipped > 0:
        print(f"    [NOTE] Skipped {skipped} interactions (driver not found)")
    print(f"    Feature matrix: {X.shape}")
    print(f"    Labels: {y.shape} (mean={y.mean():.3f})")
    
    return X, y


def evaluate_model(model, X_test, y_test):
    """Evaluate model on test set."""
    y_pred = model.predict(X_test).flatten()
    
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"\n--- Model Evaluation ---")
    print(f"   RMSE:  {rmse:.4f}")
    print(f"   R2:    {r2:.4f}")
    
    # Compare with formula baseline
    print(f"\n--- Formula vs Ridge Comparison ---")
    formula_scores = np.array([
        sum(WEIGHTS[k] * X_test[i, j] for j, k in enumerate(FEATURE_NAMES))
        for i in range(len(X_test))
    ])
    formula_rmse = np.sqrt(mean_squared_error(y_test, formula_scores))
    print(f"   Formula RMSE: {formula_rmse:.4f}")
    print(f"   Ridge RMSE:   {rmse:.4f}")
    improvement = ((formula_rmse - rmse) / formula_rmse) * 100
    print(f"   Improvement:  {improvement:.1f}%")
    
    return {'rmse': rmse, 'r2': r2, 'formula_rmse': formula_rmse}


def main():
    print("=" * 60)
    print("  AutoAid Recommender — Training Pipeline")
    print("=" * 60)
    
    # 1. Load data
    drivers_df, interactions_df, drivers_dict = load_data()
    
    # 2. Pre-compute sentiments (rule-based for speed, RoBERTa if available)
    sentiment_cache = precompute_sentiments(drivers_df)
    
    # 3. Build training data
    X, y = build_training_data(interactions_df, drivers_dict, sentiment_cache)
    
    # 4. Train/test split
    print("\n[*] Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"    Train: {X_train.shape[0]:,} samples")
    print(f"    Test:  {X_test.shape[0]:,} samples")
    
    # 5. Train Ridge Regression
    print("\n[*] Training Ridge Regression...")
    ranker = RidgeRanker()
    ranker.train(X_train, y_train)
    
    # 6. Evaluate
    metrics = evaluate_model(ranker, X_test, y_test)
    
    # 7. Save model
    print("\n[*] Saving trained model...")
    ranker.save()
    
    # 8. Save sentiment cache
    cache_path = os.path.join(
        os.path.dirname(__file__), 'models', 'sentiment_cache.json'
    )
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    with open(cache_path, 'w') as f:
        json.dump(
            {k: {'score': v[0], 'confidence': v[1]} for k, v in sentiment_cache.items()},
            f, indent=2
        )
    print(f"[SAVED] Sentiment cache -> {cache_path}")
    
    # 9. Demo: rank top 10 drivers for a sample user
    print("\n" + "=" * 60)
    print("  DEMO: Top 10 drivers for a user in Lahore")
    print("=" * 60)
    
    user_lat, user_lon = 31.5204, 74.3587  # Lahore center
    
    demo_drivers = []
    demo_features = []
    for _, driver in drivers_df.head(100).iterrows():
        d = driver.to_dict()
        sent = sentiment_cache.get(d['driver_id'], (0.5, 0.0))
        features = build_feature_vector(
            d, user_lat, user_lon,
            sentiment_score=sent[0],
            review_count=len(d.get('reviews', []))
        )
        demo_drivers.append(d)
        demo_features.append(features)
    
    from pipeline.scoring import rank_drivers
    ranked = rank_drivers(demo_drivers, demo_features, ridge_model=ranker, top_n=10)
    
    print(f"\n{'Rank':<5} {'Driver':<25} {'City':<15} {'Rating':<8} {'Score':<8}")
    print("-" * 65)
    for i, (driver, score) in enumerate(ranked, 1):
        print(f"{i:<5} {driver['name']:<25} {driver['city']:<15} {driver['avg_rating']:<8} {score:<8.4f}")
    
    print(f"\n{'='*60}")
    print(f"  [DONE] Training pipeline complete!")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
