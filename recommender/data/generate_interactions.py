"""
Generate user interaction data for Ridge Regression training.
Simulates users searching for drivers, being shown results, and hiring one.
Uses the merged 2,700 driver dataset.
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2

np.random.seed(42)

# ── Haversine distance ──
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))

# ── City centers for user locations ──
CITIES = {
    "Karachi": (24.8607, 67.0011), "Lahore": (31.5204, 74.3587),
    "Faisalabad": (31.4187, 73.0791), "Rawalpindi": (33.5651, 73.0169),
    "Multan": (30.1575, 71.5249), "Islamabad": (33.6844, 73.0479),
    "Peshawar": (34.0151, 71.5249), "Gujranwala": (32.1877, 74.1945),
    "Hyderabad": (25.3960, 68.3578), "Quetta": (30.1798, 66.9750),
    "Bahawalpur": (29.3544, 71.6911), "Sargodha": (32.0836, 72.6711),
    "Sialkot": (32.4945, 74.5229), "Abbottabad": (34.1688, 73.2215),
    "Sukkur": (27.7052, 68.8574), "Sahiwal": (30.6682, 73.1114),
    "DG Khan": (30.0489, 70.6455), "Mardan": (34.1986, 72.0404),
    "Swat": (35.2227, 72.3526), "Larkana": (27.5570, 68.2028),
    "Bannu": (32.9889, 70.6046), "DI Khan": (31.8626, 70.9019),
    "Gwadar": (25.1264, 62.3225), "Mirpurkhas": (25.5276, 69.0159),
}

# ── Load merged drivers ──
print("[*] Loading merged driver dataset...")
drivers_df = pd.read_csv("drivers_merged.csv")
drivers_df['reviews'] = drivers_df['reviews'].apply(json.loads)
print(f"    Loaded {len(drivers_df)} drivers")

# ── Generate users ──
def generate_users(n=500):
    """Generate user profiles with locations near city centers."""
    users = []
    city_names = list(CITIES.keys())
    # Weight by population (same as driver distribution)
    weights = np.array([0.18, 0.14, 0.08, 0.07, 0.06, 0.06, 0.05, 0.05,
               0.04, 0.04, 0.03, 0.03, 0.03, 0.02, 0.02, 0.02,
               0.02, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01])
    weights = weights / weights.sum()  # normalize to exactly 1.0

    for i in range(n):
        city = np.random.choice(city_names, p=weights)
        center_lat, center_lon = CITIES[city]
        # User location scattered within ~5km of city center
        lat = round(center_lat + np.random.normal(0, 0.02), 6)
        lon = round(center_lon + np.random.normal(0, 0.02), 6)
        users.append({
            'user_id': f'USR_{i+1:04d}',
            'city': city,
            'lat': lat,
            'lon': lon,
        })
    return users

# ── Generate interactions ──
def generate_interactions(users, drivers_df, searches_per_user=8):
    """
    For each user search:
    1. Find 10 nearby drivers (within same city or closest)
    2. Rank them by a realistic preference (rating + distance + online)
    3. User hires one (biased toward top-ranked)
    4. Log all shown drivers with hired/skipped labels
    """
    interactions = []
    interaction_id = 0

    for user in users:
        user_city = user['city']
        user_lat = user['lat']
        user_lon = user['lon']

        for search_idx in range(searches_per_user):
            # Find drivers in the same city
            city_drivers = drivers_df[drivers_df['city'] == user_city]

            if len(city_drivers) < 5:
                # If not enough drivers in city, expand to all
                city_drivers = drivers_df

            # Calculate distance to each driver
            distances = city_drivers.apply(
                lambda d: haversine(user_lat, user_lon, d['lat'], d['lon']), axis=1
            )

            # Pick 10 closest drivers (simulating search results)
            closest_idx = distances.nsmallest(10).index
            shown_drivers = city_drivers.loc[closest_idx].copy()
            shown_distances = distances.loc[closest_idx]

            if len(shown_drivers) == 0:
                continue

            # Calculate hire probability based on realistic factors:
            # Higher rating, closer distance, online status → more likely to be hired
            hire_scores = []
            for idx, driver in shown_drivers.iterrows():
                d_km = shown_distances[idx]
                score = (
                    driver['avg_rating'] * 0.4 +              # Rating matters most
                    np.exp(-0.3 * d_km) * 0.3 +               # Closer = better
                    (1.0 if driver['is_online'] else 0.3) * 0.2 +  # Online preferred
                    np.log1p(driver['completed_jobs']) * 0.02 + # Experience boost
                    np.random.normal(0, 0.1)                   # Random noise
                )
                hire_scores.append(max(score, 0.01))

            # Normalize to probabilities
            hire_probs = np.array(hire_scores)
            hire_probs = hire_probs / hire_probs.sum()

            # User hires one driver
            hired_idx = np.random.choice(shown_drivers.index, p=hire_probs)

            # Random timestamp (last 6 months, weighted toward recent)
            days_ago = int(np.random.exponential(60))
            ts = datetime.now() - timedelta(
                days=min(days_ago, 180),
                hours=np.random.randint(0, 24),
                minutes=np.random.randint(0, 60)
            )

            # Create interaction records for all shown drivers
            for rank, (idx, driver) in enumerate(shown_drivers.iterrows(), 1):
                was_hired = idx == hired_idx

                # Rating given (only if hired, realistic distribution)
                rating_given = None
                if was_hired:
                    # Users tend to rate close to driver's existing rating ± noise
                    rating_given = round(
                        np.clip(driver['avg_rating'] + np.random.normal(0, 0.5), 1.0, 5.0), 1
                    )

                interactions.append({
                    'interaction_id': f'INT_{interaction_id+1:06d}',
                    'user_id': user['user_id'],
                    'provider_id': driver['driver_id'],
                    'user_lat': user_lat,
                    'user_lon': user_lon,
                    'shown_rank': rank,
                    'was_hired': was_hired,
                    'rating_given': rating_given,
                    'timestamp': ts.strftime("%Y-%m-%d %H:%M:%S"),
                })
                interaction_id += 1

    return pd.DataFrame(interactions)


def main():
    print("=" * 60)
    print("  AutoAid Interaction Data Generator")
    print("=" * 60)

    # Generate 500 users
    print("\n[*] Generating 500 users...")
    users = generate_users(500)
    print(f"    Created {len(users)} users across {len(set(u['city'] for u in users))} cities")

    # Generate interactions (8 searches per user)
    print("[*] Generating interactions (8 searches x 500 users)...")
    interactions_df = generate_interactions(users, drivers_df, searches_per_user=8)

    # Stats
    total = len(interactions_df)
    hired = interactions_df['was_hired'].sum()
    skipped = total - hired

    print(f"\n{'='*60}")
    print(f"  INTERACTION DATA SUMMARY")
    print(f"{'='*60}")
    print(f"  Total interaction records:  {total:,}")
    print(f"  Hired (positive labels):    {hired:,} ({hired/total*100:.1f}%)")
    print(f"  Skipped (negative labels):  {skipped:,} ({skipped/total*100:.1f}%)")
    print(f"  Unique users:               {interactions_df['user_id'].nunique()}")
    print(f"  Unique drivers shown:       {interactions_df['provider_id'].nunique()}")

    print(f"\n--- Hire rate by rank position ---")
    rank_hire = interactions_df.groupby('shown_rank')['was_hired'].mean()
    for rank, rate in rank_hire.items():
        bar = '#' * int(rate * 50)
        print(f"   Rank {rank:2d}: {rate*100:5.1f}% {bar}")

    # Save interactions
    interactions_df.to_csv("interactions.csv", index=False)
    print(f"\n[SAVED] interactions.csv ({total:,} rows)")

    # Save users
    users_df = pd.DataFrame(users)
    users_df.to_csv("users.csv", index=False)
    print(f"[SAVED] users.csv ({len(users)} rows)")

    print(f"\n{'='*60}")
    print(f"  [DONE] Interaction data generation complete!")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
