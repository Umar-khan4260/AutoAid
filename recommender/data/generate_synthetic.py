"""
AutoAid Driver Search — Synthetic Data Generator
Generates 2,000 driver profiles with realistic reviews
across all division-level cities of Pakistan.

Note: This is for driver-only hiring. The car belongs to
the customer — we are hiring the driver, not driver + car.
"""

import json
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Seed for reproducibility
np.random.seed(42)
random.seed(42)

# ══════════════════════════════════════════════════
# PAKISTAN DIVISION-LEVEL CITIES (with coordinates)
# ══════════════════════════════════════════════════
CITIES = {
    # Punjab
    "Lahore":       {"lat": 31.5204, "lon": 74.3587, "weight": 0.14},
    "Faisalabad":   {"lat": 31.4187, "lon": 73.0791, "weight": 0.08},
    "Rawalpindi":   {"lat": 33.5651, "lon": 73.0169, "weight": 0.07},
    "Multan":       {"lat": 30.1575, "lon": 71.5249, "weight": 0.06},
    "Gujranwala":   {"lat": 32.1877, "lon": 74.1945, "weight": 0.05},
    "Sialkot":      {"lat": 32.4945, "lon": 74.5229, "weight": 0.03},
    "Bahawalpur":   {"lat": 29.3544, "lon": 71.6911, "weight": 0.03},
    "Sargodha":     {"lat": 32.0836, "lon": 72.6711, "weight": 0.03},
    "DG Khan":      {"lat": 30.0489, "lon": 70.6455, "weight": 0.02},
    "Sahiwal":      {"lat": 30.6682, "lon": 73.1114, "weight": 0.02},

    # Sindh
    "Karachi":      {"lat": 24.8607, "lon": 67.0011, "weight": 0.18},
    "Hyderabad":    {"lat": 25.3960, "lon": 68.3578, "weight": 0.04},
    "Sukkur":       {"lat": 27.7052, "lon": 68.8574, "weight": 0.02},
    "Larkana":      {"lat": 27.5570, "lon": 68.2028, "weight": 0.01},
    "Mirpurkhas":   {"lat": 25.5276, "lon": 69.0159, "weight": 0.01},

    # KPK
    "Peshawar":     {"lat": 34.0151, "lon": 71.5249, "weight": 0.05},
    "Mardan":       {"lat": 34.1986, "lon": 72.0404, "weight": 0.02},
    "Abbottabad":   {"lat": 34.1688, "lon": 73.2215, "weight": 0.02},
    "Swat":         {"lat": 35.2227, "lon": 72.3526, "weight": 0.01},
    "Bannu":        {"lat": 32.9889, "lon": 70.6046, "weight": 0.01},
    "DI Khan":      {"lat": 31.8626, "lon": 70.9019, "weight": 0.01},

    # Balochistan
    "Quetta":       {"lat": 30.1798, "lon": 66.9750, "weight": 0.04},
    "Gwadar":       {"lat": 25.1264, "lon": 62.3225, "weight": 0.01},

    # Capital
    "Islamabad":    {"lat": 33.6844, "lon": 73.0479, "weight": 0.06},
}

# Normalize weights to sum to 1
total_weight = sum(c["weight"] for c in CITIES.values())
for city in CITIES.values():
    city["weight"] /= total_weight

# ══════════════════════════════════════════════════
# PAKISTANI NAMES
# ══════════════════════════════════════════════════
FIRST_NAMES = [
    "Ahmed", "Muhammad", "Ali", "Hassan", "Usman", "Bilal", "Farhan", "Imran",
    "Kashif", "Nadeem", "Tariq", "Waqar", "Zubair", "Asif", "Sajid", "Kamran",
    "Rizwan", "Shahid", "Junaid", "Irfan", "Adnan", "Faisal", "Hamza", "Aamir",
    "Naveed", "Shoaib", "Yasir", "Rashid", "Tanveer", "Arif", "Salman", "Waseem",
    "Khalid", "Zahid", "Naeem", "Majid", "Saeed", "Tahir", "Danish", "Fahad",
    "Omar", "Babar", "Shafiq", "Anwar", "Raza", "Akbar", "Aslam", "Pervaiz",
    "Ghulam", "Nasir", "Habib", "Safdar", "Jamil", "Azhar", "Mushtaq", "Iqbal",
    "Sohail", "Amjad", "Ashfaq", "Liaqat",
]

LAST_NAMES = [
    "Khan", "Ahmed", "Ali", "Hussain", "Shah", "Malik", "Butt", "Chaudhry",
    "Raza", "Iqbal", "Qureshi", "Siddiqui", "Sheikh", "Mirza", "Bhatti",
    "Aslam", "Gill", "Javed", "Mughal", "Niazi", "Afridi", "Yousafzai",
    "Baloch", "Mengal", "Leghari", "Mazari", "Khattak", "Durrani", "Abbasi",
    "Hashmi", "Rajput", "Awan", "Gondal", "Warraich", "Cheema", "Virk",
    "Randhawa", "Khokhar", "Sethi", "Paracha",
]

LICENSE_TYPES = ["LTV", "HTV", "PSV", "LTV+HTV"]
LICENSE_WEIGHTS = [0.50, 0.20, 0.15, 0.15]

# ══════════════════════════════════════════════════
# REVIEW TEMPLATES (Pakistani English, driver-specific)
# ══════════════════════════════════════════════════
POSITIVE_REVIEWS = [
    "Very punctual driver. {name} arrived in {time} minutes. Highly recommended!",
    "Smooth and professional driving. {name} bhai handles my car with great care.",
    "Best driver I have hired! {name} knows every shortcut in {city}.",
    "{name} is very respectful and well-mannered. Safe driving throughout.",
    "Very cooperative driver. Helped with everything. 5 stars!",
    "Excellent driving skills. Felt very safe with {name} behind the wheel.",
    "{name} bhai drove carefully and followed all traffic rules. Recommended.",
    "{name} is always on time. Very reliable and trustworthy driver.",
    "Been hiring {name} for months now. Always reliable and professional.",
    "Professional attitude. {name} treats my car like his own. Very careful.",
    "My family felt very comfortable with {name} driving. Very careful on roads.",
    "Called at late night, {name} still came within {time} minutes. Lifesaver!",
    "Best driver in {city}! Very experienced and knows all routes.",
    "{name} is an expert driver. Handles heavy traffic in {city} with ease.",
    "I regularly hire {name}. Never disappointed. Top class driving skills.",
    "Very disciplined driver. No phone use, no speeding. Exactly what you want.",
    "{name} drives very smoothly even on rough roads. Experienced professional.",
    "Hired {name} for a long trip. Drove for 6 hours without any issue. Superb!",
    "Very patient driver. Doesn't get angry in traffic jams. Professional.",
    "Trustworthy and honest. Left my belongings in the car and {name} returned them.",
]

NEUTRAL_REVIEWS = [
    "Okay driving. {name} got the job done but nothing special.",
    "Decent experience. {name} was quiet but drove fine.",
    "Average driver. Took a slightly longer route than needed.",
    "Driving was fine. But {name} could be more punctual.",
    "Normal experience. Nothing to complain about, nothing to praise.",
    "Arrived a bit late but drove well once he started.",
    "Basic driving skills. Would hire again if no better option.",
    "{name} is an okay driver. Not the best, not the worst.",
    "Took longer than expected to arrive but driving was smooth.",
    "{name} drove fine but was on the phone a couple of times.",
]

NEGATIVE_REVIEWS = [
    "Very late arrival. Had to wait {time} minutes. Not acceptable.",
    "Rude behavior. {name} was on phone the entire time while driving.",
    "Reckless driving! {name} was speeding and jumping red lights.",
    "{name} cancelled last minute after I waited for 20 minutes.",
    "Extremely rough driving. Was scared for my car the entire time.",
    "Argued about payment at the end. Very unprofessional behavior.",
    "{name} drove very carelessly. Almost had an accident twice.",
    "Unreliable. {name} said he would come at 8am but showed up at 10.",
    "Very poor driving. {name} doesn't know the routes in {city} at all.",
    "Irresponsible driver. Was driving fast in a residential area.",
    "{name} was not careful with my car at all. Found scratches after.",
    "Showed up smelling of cigarettes and was rude when asked about it.",
]


def generate_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def generate_reviews_for_driver(name, city, avg_rating, completed_jobs):
    """
    Generate reviews proportional to completed jobs.
    ~30-50% of completed rides leave a review (realistic).
    Sentiment distribution correlates with avg_rating.
    """
    # Number of reviews = 30-50% of completed jobs, capped at 50
    review_ratio = np.random.uniform(0.3, 0.5)
    n_reviews = min(int(completed_jobs * review_ratio), 50)

    if n_reviews == 0:
        return []

    # Sentiment distribution based on rating
    if avg_rating >= 4.5:
        pos_pct, neu_pct, neg_pct = 0.80, 0.15, 0.05
    elif avg_rating >= 4.0:
        pos_pct, neu_pct, neg_pct = 0.65, 0.25, 0.10
    elif avg_rating >= 3.5:
        pos_pct, neu_pct, neg_pct = 0.45, 0.35, 0.20
    elif avg_rating >= 3.0:
        pos_pct, neu_pct, neg_pct = 0.25, 0.35, 0.40
    else:
        pos_pct, neu_pct, neg_pct = 0.10, 0.20, 0.70

    reviews = []
    for _ in range(n_reviews):
        sentiment = np.random.choice(
            ["positive", "neutral", "negative"],
            p=[pos_pct, neu_pct, neg_pct]
        )

        first_name = name.split()[0]
        time_val = random.randint(5, 45)

        if sentiment == "positive":
            template = random.choice(POSITIVE_REVIEWS)
        elif sentiment == "neutral":
            template = random.choice(NEUTRAL_REVIEWS)
        else:
            template = random.choice(NEGATIVE_REVIEWS)

        review_text = template.format(name=first_name, city=city, time=time_val)
        reviews.append(review_text)

    return reviews


def generate_drivers(n=2000):
    """Generate n driver profiles with embedded reviews."""
    city_names = list(CITIES.keys())
    city_weights = [CITIES[c]["weight"] for c in city_names]

    drivers = []

    for i in range(n):
        # Pick city weighted by population
        city = np.random.choice(city_names, p=city_weights)
        center = CITIES[city]

        # Scatter within ~10km of city center
        lat = round(center["lat"] + np.random.normal(0, 0.04), 6)
        lon = round(center["lon"] + np.random.normal(0, 0.04), 6)

        # Driver attributes with realistic distributions
        years_exp = max(1, int(np.random.exponential(5)) + 1)
        completed_jobs = max(0, int(np.random.pareto(1.2) * 15))

        # Rating correlates with experience + some noise
        base_rating = 3.5 + (years_exp / 20) * 1.0  # more exp → slightly higher base
        avg_rating = round(np.clip(np.random.normal(base_rating, 0.6), 1.0, 5.0), 2)

        # Rating count = subset of completed jobs
        rating_count = max(0, int(completed_jobs * np.random.uniform(0.4, 0.7)))

        # Cancellations inversely correlate with rating
        cancel_base = max(0, (4.5 - avg_rating) * 3)
        cancellations = max(0, int(np.random.poisson(cancel_base)))

        # Accepted = completed + cancellations + some in-progress
        accepted_jobs = completed_jobs + cancellations + int(np.random.poisson(2))

        # Response time: good drivers respond faster
        resp_base = 30 - (avg_rating - 1) * 5  # higher rating → lower base
        avg_response_time_min = round(max(3, np.random.exponential(resp_base) + 3), 1)

        # License type
        license_type = np.random.choice(LICENSE_TYPES, p=LICENSE_WEIGHTS)

        # Online status (~60% online)
        is_online = random.random() < 0.6

        # Generate name
        name = generate_name()

        # Generate reviews (proportional to completed jobs)
        reviews = generate_reviews_for_driver(name, city, avg_rating, completed_jobs)

        # Job timestamps for recency weighting
        job_timestamps = []
        for _ in range(completed_jobs):
            days_ago = int(np.random.exponential(120))
            ts = datetime.now() - timedelta(days=min(days_ago, 730))
            job_timestamps.append(ts.strftime("%Y-%m-%d %H:%M:%S"))

        drivers.append({
            "driver_id": f"DRV_{i+1:04d}",
            "name": name,
            "city": city,
            "lat": lat,
            "lon": lon,
            "avg_rating": avg_rating,
            "rating_count": rating_count,
            "completed_jobs": completed_jobs,
            "accepted_jobs": accepted_jobs,
            "cancellations": cancellations,
            "license_type": license_type,
            "years_experience": years_exp,
            "avg_response_time_min": avg_response_time_min,
            "is_online": is_online,
            "reviews": reviews,
            "job_timestamps": job_timestamps,
        })

    return pd.DataFrame(drivers)


def main():
    print("=" * 60)
    print("  AutoAid Synthetic Driver Data Generator")
    print("=" * 60)

    # Generate 2000 drivers
    print("\n[*] Generating 2,000 driver profiles...")
    df = generate_drivers(2000)

    # -- Stats --
    print(f"\n[OK] Generated {len(df)} drivers across {df['city'].nunique()} cities")
    print(f"\n--- City Distribution ---")
    city_counts = df['city'].value_counts()
    for city, count in city_counts.items():
        print(f"   {city:15s} -> {count:4d} drivers ({count/len(df)*100:.1f}%)")

    print(f"\n--- Rating Distribution ---")
    print(f"   Mean:   {df['avg_rating'].mean():.2f}")
    print(f"   Median: {df['avg_rating'].median():.2f}")
    print(f"   Std:    {df['avg_rating'].std():.2f}")

    total_reviews = df['reviews'].apply(len).sum()
    print(f"\n--- Reviews ---")
    print(f"   Total Reviews: {total_reviews:,}")
    print(f"   Avg per driver: {total_reviews / len(df):.1f}")

    drivers_with_reviews = (df['reviews'].apply(len) > 0).sum()
    print(f"   Drivers with reviews: {drivers_with_reviews} ({drivers_with_reviews/len(df)*100:.0f}%)")

    print(f"\n--- License Type Distribution ---")
    for ltype, count in df['license_type'].value_counts().items():
        print(f"   {ltype:12s} -> {count:4d} ({count/len(df)*100:.1f}%)")

    # -- Save --
    # Save as CSV (reviews & timestamps as JSON strings)
    csv_df = df.copy()
    csv_df['reviews'] = csv_df['reviews'].apply(json.dumps)
    csv_df['job_timestamps'] = csv_df['job_timestamps'].apply(json.dumps)
    csv_df.to_csv("drivers_dataset.csv", index=False)
    print(f"\n[SAVED] drivers_dataset.csv ({len(df)} rows)")

    # Save as JSON (full structure)
    records = df.to_dict('records')
    with open("drivers_dataset.json", "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, default=str)
    print(f"[SAVED] drivers_dataset.json")

    # Save a sample for quick preview
    sample = df.head(5).to_dict('records')
    with open("drivers_sample.json", "w", encoding="utf-8") as f:
        json.dump(sample, f, indent=2, default=str)
    print(f"[SAVED] drivers_sample.json (5 samples for preview)")

    print("\n" + "=" * 60)
    print("  [DONE] Data generation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
