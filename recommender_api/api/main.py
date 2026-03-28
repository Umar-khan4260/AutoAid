from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import pandas as pd
import json
import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Add parent directory to path to import pipeline modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from pipeline.features import build_feature_vector, haversine
from pipeline.scoring import RidgeRanker, rank_drivers

app = FastAPI(title="AutoAid Recommender API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://autoaidDb:8765%401234@autoaid-database-cluste.7c93xlw.mongodb.net/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "test")
MONGO_USERS_COLLECTION = os.getenv("MONGO_USERS_COLLECTION", "users")
DRIVER_USER_TYPE = os.getenv("DRIVER_USER_TYPE", "driver")

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'training', 'models')

# --- MongoDB Connection ---
mongo_client = None
users_collection = None

def get_mongo_collection():
    """Lazy-connect to MongoDB and return the users collection."""
    global mongo_client, users_collection
    if users_collection is None:
        try:
            print("[*] Connecting to MongoDB Atlas...")
            mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # Verify connection
            mongo_client.server_info()
            db = mongo_client[MONGO_DB_NAME]
            users_collection = db[MONGO_USERS_COLLECTION]
            print(f"[OK] Connected to MongoDB: {MONGO_DB_NAME}.{MONGO_USERS_COLLECTION}")
        except Exception as e:
            print(f"[ERROR] MongoDB connection failed: {e}")
            users_collection = None
    return users_collection

# --- Fallback: CSV Data ---
# Only used if MongoDB is unavailable
CSV_FALLBACK_DRIVERS = []
try:
    print("[*] Loading CSV fallback driver data...")
    drivers_df = pd.read_csv(os.path.join(DATA_DIR, 'drivers_merged.csv'))
    drivers_df['reviews'] = drivers_df['reviews'].apply(lambda x: json.loads(x) if isinstance(x, str) else x)
    drivers_df['job_timestamps'] = drivers_df['job_timestamps'].apply(lambda x: json.loads(x) if isinstance(x, str) else x)
    CSV_FALLBACK_DRIVERS = drivers_df.to_dict('records')
    print(f"[OK] CSV fallback loaded: {len(CSV_FALLBACK_DRIVERS)} drivers")
except Exception as e:
    print(f"[WARN] Could not load CSV fallback: {e}")

# --- Load Trained Ridge Model ---
ranker = RidgeRanker(os.path.join(MODELS_DIR, 'ridge_ranker.joblib'))
if ranker.load():
    print("[OK] Ridge model loaded successfully")
else:
    print("[WARN] Ridge model not found. Will use formula-based fallback scoring.")

# --- Load Pre-computed Sentiment Cache ---
try:
    with open(os.path.join(MODELS_DIR, 'sentiment_cache.json'), 'r') as f:
        SENTIMENT_CACHE = json.load(f)
    print(f"[OK] Loaded sentiment cache for {len(SENTIMENT_CACHE)} drivers")
except Exception as e:
    print(f"[WARN] Could not load sentiment cache: {e}. Will default to neutral sentiment.")
    SENTIMENT_CACHE = {}


def normalize_driver(doc):
    """
    Normalize a MongoDB user document (user_type='driver') into
    the standard driver dict expected by the feature pipeline.
    
    Maps flexible MongoDB field names to the fixed internal keys.
    """
    # Extract location from User schema's currentLocation
    curr_loc = doc.get('currentLocation', {})
    if isinstance(curr_loc, dict) and 'lat' in curr_loc and ('lng' in curr_loc or 'lon' in curr_loc):
        lat = float(curr_loc.get('lat', 0.0))
        lon = float(curr_loc.get('lng', curr_loc.get('lon', 0.0)))
    else:
        # Fallback to old format
        lat = float(doc.get('lat', doc.get('latitude', 0.0)))
        lon = float(doc.get('lon', doc.get('longitude', 0.0)))

    # Ensure valid floats
    try:
        lat, lon = float(lat), float(lon)
    except (ValueError, TypeError):
        lat, lon = 0.0, 0.0

    return {
        'driver_id': str(doc.get('_id', doc.get('driver_id', 'UNKNOWN'))),
        'name': doc.get('name', doc.get('fullName', 'Unknown Driver')),
        'lat': lat,
        'lon': lon,
        'avg_rating': float(doc.get('providerDetails', {}).get('averageRating', doc.get('avg_rating', 4.0))),
        'rating_count': int(doc.get('providerDetails', {}).get('totalRatings', doc.get('ratingCount', 0))),
        'completed_jobs': int(doc.get('providerDetails', {}).get('completedJobsCount', doc.get('completedJobs', 0))),
        'accepted_jobs': int(doc.get('accepted_jobs', doc.get('acceptedJobs', 1))),
        'cancellations': int(doc.get('cancellations', 0)),
        'avg_response_time_min': float(doc.get('avg_response_time_min', doc.get('responseTime', 30))),
        'is_online': bool(doc.get('is_online', doc.get('isOnline', doc.get('online', doc.get('isAvailable', False))))),
        'reviews': doc.get('reviews', []),
        'job_timestamps': doc.get('job_timestamps', doc.get('jobTimestamps', [])),
        'license_type': doc.get('license_type', doc.get('licenseType', 'N/A')),
    }


def fetch_drivers_from_mongo(user_lat, user_lon, radius_km):
    """
    Fetch registered drivers from MongoDB within radius_km of (user_lat, user_lon).
    Falls back to CSV data if MongoDB is not available.
    Returns (list_of_driver_dicts, distances_dict, source)
    """
    collection = get_mongo_collection()

    # --- Primary: MongoDB ---
    if collection is not None:
        try:
            # Query documents for available temporary drivers
            cursor = collection.find({
                "role": "provider",
                "providerDetails.serviceType": {"$in": ["temporary-driver", "Temporary Driver", "Temporary-Driver"]},
                "isAvailable": True
            })
            
            nearby_drivers = []
            distances = {}
            
            for doc in cursor:
                driver = normalize_driver(doc)
                
                # Skip drivers with no real location data
                if driver['lat'] == 0.0 and driver['lon'] == 0.0:
                    continue
                    
                dist = haversine(user_lat, user_lon, driver['lat'], driver['lon'])
                if dist <= radius_km:
                    nearby_drivers.append(driver)
                    distances[driver['driver_id']] = dist
                    
            print(f"[MongoDB] Found {len(nearby_drivers)} drivers within {radius_km}km")
            if nearby_drivers:
                return nearby_drivers, distances, "mongodb"
            else:
                print(f"[MongoDB] 0 drivers found. Falling back to CSV.")
            
        except Exception as e:
            print(f"[WARN] MongoDB query failed: {e}. Falling back to CSV.")

    # --- Fallback: CSV ---
    print("[FALLBACK] Using CSV driver data")
    nearby_drivers = []
    distances = {}
    for d in CSV_FALLBACK_DRIVERS:
        dist = haversine(user_lat, user_lon, d['lat'], d['lon'])
        if dist <= radius_km:
            nearby_drivers.append(d)
            distances[d['driver_id']] = dist
    return nearby_drivers, distances, "csv_fallback"


# --- Request Models ---

class SearchRequest(BaseModel):
    user_id: str
    lat: float
    lon: float
    city: str = None
    top_n: int = 20
    radius_km: float = 10.0

class InteractionFeedback(BaseModel):
    user_id: str
    interaction_id: str
    selected_driver_id: str
    shown_driver_ids: list[str]
    timestamp: str = None


# --- Endpoints ---

@app.get("/health")
def health_check():
    collection = get_mongo_collection()
    mongo_ok = collection is not None
    try:
        driver_count = collection.count_documents({"user_type": DRIVER_USER_TYPE}) if mongo_ok else 0
    except Exception:
        driver_count = 0
        
    return {
        "status": "healthy",
        "mongodb_connected": mongo_ok,
        "registered_drivers_in_db": driver_count,
        "csv_fallback_drivers": len(CSV_FALLBACK_DRIVERS),
        "model_loaded": ranker.is_trained()
    }


@app.post("/api/search")
def search_drivers(req: SearchRequest):
    """
    Search endpoint — fetches registered drivers from MongoDB (user_type='driver'),
    builds AI feature vectors, and returns a ranked list.
    """
    nearby_drivers, distances, source = fetch_drivers_from_mongo(
        req.lat, req.lon, req.radius_km
    )

    if not nearby_drivers:
        return {
            "results": [],
            "source": source,
            "interaction_id": f"SRCH_{int(datetime.now().timestamp())}"
        }

    # Build Feature Vectors
    features_list = []
    for driver in nearby_drivers:
        driver_id = driver['driver_id']
        if driver_id in SENTIMENT_CACHE:
            sent_score = SENTIMENT_CACHE[driver_id].get('score', 0.5)
        else:
            sent_score = 0.5

        review_count = len(driver.get('reviews', []))
        features = build_feature_vector(
            driver=driver,
            user_lat=req.lat,
            user_lon=req.lon,
            sentiment_score=sent_score,
            review_count=review_count
        )
        features_list.append(features)

    # Rank using Ridge AI Model
    ranked_results = rank_drivers(
        drivers=nearby_drivers,
        features_list=features_list,
        ridge_model=ranker,
        top_n=req.top_n
    )

    # Format Output
    output = []
    for rank, (driver, score) in enumerate(ranked_results, 1):
        output.append({
            "rank": rank,
            "driver_id": driver['driver_id'],
            "name": driver['name'],
            "lat": driver['lat'],
            "lon": driver['lon'],
            "rating": driver['avg_rating'],
            "jobs_completed": driver['completed_jobs'],
            "license": driver.get('license_type', 'N/A'),
            "is_online": driver['is_online'],
            "distance_km": round(distances[driver['driver_id']], 2),
            "score": round(score, 4)
        })

    interaction_id = f"SRCH_{int(datetime.now().timestamp())}_{req.user_id[-4:]}"

    return {
        "interaction_id": interaction_id,
        "source": source,
        "results": output
    }


@app.post("/api/feedback")
def log_feedback(feedback: InteractionFeedback):
    """
    Log when a user selects (hires) a driver from search results.
    This data is used to continuously retrain the Ridge model.
    """
    ts = feedback.timestamp or datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_records = []
    for rank, d_id in enumerate(feedback.shown_driver_ids, 1):
        was_hired = (d_id == feedback.selected_driver_id)
        new_records.append({
            "interaction_id": feedback.interaction_id,
            "user_id": feedback.user_id,
            "provider_id": d_id,
            "shown_rank": rank,
            "was_hired": was_hired,
            "timestamp": ts,
            "user_lat": 0.0,
            "user_lon": 0.0
        })

    try:
        interactions_path = os.path.join(DATA_DIR, 'interactions.csv')
        new_df = pd.DataFrame(new_records)
        if os.path.exists(interactions_path):
            new_df.to_csv(interactions_path, mode='a', header=False, index=False)
        else:
            new_df.to_csv(interactions_path, index=False)

        print(f"[LOG] Logged feedback for interaction {feedback.interaction_id}")
        return {"status": "success", "message": "Feedback logged successfully"}
    except Exception as e:
        print(f"[ERROR] Failed to log feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to log feedback")


if __name__ == "__main__":
    print("=" * 50)
    print(" Starting AutoAid Recommender API")
    print("=" * 50)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
