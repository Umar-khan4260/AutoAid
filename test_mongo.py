import pymongo

try:
    # Use the Atlas URI from the backend .env
    client = pymongo.MongoClient("mongodb+srv://autoaidDb:8765%401234@autoaid-database-cluste.7c93xlw.mongodb.net/", serverSelectionTimeoutMS=5000)
    db = client["test"] # The URI points to the 'test' database or default? Let's check 'autoaid' first as it was in the URI originally? Wait, the URI ends with / which means default db or the one specified. The backend uses 'autoaid' usually.
    # Actually, looking at the URI: ...mongodb.net/ (no db name specified at the end).
    # I'll check both 'test' and 'autoaid' if needed.
    db = client["test"] 
    collection = db["users"]
    
    print("Connected. Count total users:", collection.count_documents({}))
    print("Count total providers:", collection.count_documents({"role": "provider"}))
    print("Count providers with temporary-driver:", collection.count_documents({"role": "provider", "providerDetails.serviceType": {"$in": ["temporary-driver", "Temporary Driver", "Temporary-Driver"]}}))
    print("Count providers available:", collection.count_documents({"role": "provider", "isAvailable": True}))
    
    cursor = collection.find({
        "role": "provider",
    })
    
    docs = list(cursor)
    print("--- ALL PROVIDERS ---")
    for d in docs:
        print("EMAIL:", d.get("email"), 
              "| AVAILABLE:", d.get("isAvailable"), 
              "| LOC:", d.get("currentLocation"), 
              "| DETAILS:", d.get("providerDetails"))
        
except Exception as e:
    print("Error:", e)
