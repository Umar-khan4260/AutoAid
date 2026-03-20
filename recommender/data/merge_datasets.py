"""
Merge AI-generated (ai-gen.txt) and script-generated (drivers_dataset.csv) data.
Randomly shuffles both datasets together, re-assigns driver IDs sequentially,
and saves the final merged dataset.
"""

import json
import pandas as pd
import numpy as np
import re

np.random.seed(42)

# ── Step 1: Load script-generated CSV ──
print("[*] Loading script-generated drivers_dataset.csv...")
csv_df = pd.read_csv("drivers_dataset.csv")
csv_df['reviews'] = csv_df['reviews'].apply(json.loads)
csv_df['job_timestamps'] = csv_df['job_timestamps'].apply(json.loads)
print(f"    Loaded {len(csv_df)} script-generated drivers")

# ── Step 2: Load AI-generated data (handles multiple JSON arrays) ──
print("[*] Loading AI-generated ai-gen.txt...")
with open("ai-gen.txt", "r", encoding="utf-8") as f:
    raw = f.read().strip()

# The file may contain multiple JSON arrays concatenated together
# Strategy: find all top-level JSON arrays using bracket matching
ai_records = []
decoder = json.JSONDecoder()
pos = 0
while pos < len(raw):
    # Skip whitespace and newlines
    while pos < len(raw) and raw[pos] in ' \t\n\r':
        pos += 1
    if pos >= len(raw):
        break
    try:
        obj, end_pos = decoder.raw_decode(raw, pos)
        if isinstance(obj, list):
            ai_records.extend(obj)
        elif isinstance(obj, dict):
            ai_records.append(obj)
        pos = end_pos
    except json.JSONDecodeError:
        pos += 1

print(f"    Loaded {len(ai_records)} AI-generated drivers")

# Convert AI records to DataFrame
ai_df = pd.DataFrame(ai_records)

# ── Step 3: Align columns ──
# Ensure both DataFrames have the same columns
# CSV has: driver_id, name, city, lat, lon, avg_rating, rating_count,
#          completed_jobs, accepted_jobs, cancellations, license_type,
#          years_experience, avg_response_time_min, is_online, reviews, job_timestamps

# AI-gen might have 'vehicle_type' instead of 'license_type' — handle that
if 'vehicle_type' in ai_df.columns and 'license_type' not in ai_df.columns:
    ai_df.rename(columns={'vehicle_type': 'license_type'}, inplace=True)
    print("    [NOTE] Renamed 'vehicle_type' to 'license_type' in AI data")

# Ensure all required columns exist in both
required_cols = [
    'name', 'city', 'lat', 'lon', 'avg_rating', 'rating_count',
    'completed_jobs', 'accepted_jobs', 'cancellations', 'license_type',
    'years_experience', 'avg_response_time_min', 'is_online',
    'reviews', 'job_timestamps'
]

for col in required_cols:
    if col not in csv_df.columns:
        print(f"    [WARN] Missing column '{col}' in CSV data, adding default")
        csv_df[col] = None
    if col not in ai_df.columns:
        print(f"    [WARN] Missing column '{col}' in AI data, adding default")
        if col == 'reviews':
            ai_df[col] = ai_df[col].apply(lambda x: x if isinstance(x, list) else [])
        elif col == 'job_timestamps':
            ai_df[col] = ai_df[col].apply(lambda x: x if isinstance(x, list) else [])
        else:
            ai_df[col] = None

# Keep only required columns + drop old driver_id (will reassign)
csv_df = csv_df[required_cols].copy()
ai_df = ai_df[[c for c in required_cols if c in ai_df.columns]].copy()

# ── Step 4: Mark source for tracking ──
csv_df['source'] = 'script'
ai_df['source'] = 'ai'

# ── Step 5: Concatenate and randomly shuffle ──
print("[*] Merging and randomly shuffling...")
merged = pd.concat([csv_df, ai_df], ignore_index=True)
merged = merged.sample(frac=1, random_state=42).reset_index(drop=True)

# ── Step 6: Reassign driver IDs sequentially ──
merged['driver_id'] = [f"DRV_{i+1:04d}" for i in range(len(merged))]

# Reorder columns
final_cols = ['driver_id'] + required_cols + ['source']
merged = merged[final_cols]

# ── Step 7: Print stats ──
print(f"\n{'='*60}")
print(f"  MERGED DATASET SUMMARY")
print(f"{'='*60}")
print(f"  Total drivers:         {len(merged)}")
print(f"  Script-generated:      {(merged['source'] == 'script').sum()}")
print(f"  AI-generated:          {(merged['source'] == 'ai').sum()}")
print(f"  Cities covered:        {merged['city'].nunique()}")

total_reviews = merged['reviews'].apply(lambda x: len(x) if isinstance(x, list) else 0).sum()
print(f"  Total reviews:         {total_reviews:,}")
print(f"  Avg reviews/driver:    {total_reviews / len(merged):.1f}")

print(f"\n--- City Distribution (top 10) ---")
city_counts = merged['city'].value_counts().head(10)
for city, count in city_counts.items():
    print(f"   {city:15s} -> {count:4d} ({count/len(merged)*100:.1f}%)")

print(f"\n--- Rating Distribution ---")
print(f"   Mean:   {merged['avg_rating'].mean():.2f}")
print(f"   Median: {merged['avg_rating'].median():.2f}")

print(f"\n--- Source mixing (first 20 drivers) ---")
for _, row in merged.head(20).iterrows():
    print(f"   {row['driver_id']} | {row['name']:20s} | {row['city']:12s} | {row['source']}")

# ── Step 8: Save ──
# CSV version (reviews/timestamps as JSON strings)
save_df = merged.copy()
save_df['reviews'] = save_df['reviews'].apply(lambda x: json.dumps(x) if isinstance(x, list) else '[]')
save_df['job_timestamps'] = save_df['job_timestamps'].apply(lambda x: json.dumps(x) if isinstance(x, list) else '[]')
save_df.to_csv("drivers_merged.csv", index=False)
print(f"\n[SAVED] drivers_merged.csv ({len(merged)} rows)")

# JSON version (full structure)
records = merged.to_dict('records')
# Ensure reviews and timestamps are lists
for r in records:
    if not isinstance(r.get('reviews'), list):
        r['reviews'] = []
    if not isinstance(r.get('job_timestamps'), list):
        r['job_timestamps'] = []

with open("drivers_merged.json", "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2, default=str)
print(f"[SAVED] drivers_merged.json")

print(f"\n{'='*60}")
print(f"  [DONE] Merge complete!")
print(f"{'='*60}")
