import requests
import json
import time

API_URL = "http://127.0.0.1:8000"

def test_health():
    print(f"\n[*] Testing GET {API_URL}/health")
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("[ERROR] API server is not running!")
        return False

def test_search():
    print(f"\n[*] Testing POST {API_URL}/api/search")
    payload = {
        "user_id": "TEST_USER_99",
        "lat": 31.5204,  # Lahore center
        "lon": 74.3587,
        "city": "Lahore",
        "top_n": 5
    }
    
    response = requests.post(f"{API_URL}/api/search", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nReturned Interaction ID: {data['interaction_id']}")
        print(f"Found {len(data['results'])} drivers. Top 3:")
        for res in data['results'][:3]:
            print(f"  #{res['rank']} - {res['name']} ({res['driver_id']})")
            print(f"       Score: {res['score']} | Rating: {res['rating']} | Dist: ~{res['distance_km']} km")
            
        return data
    else:
        print(response.text)
        return None

def test_feedback(search_data):
    print(f"\n[*] Testing POST {API_URL}/api/feedback")
    
    # Simulate user clicking the 2nd driver
    hired_driver = search_data['results'][1]['driver_id']
    all_shown = [d['driver_id'] for d in search_data['results']]
    
    payload = {
        "user_id": "TEST_USER_99",
        "interaction_id": search_data['interaction_id'],
        "selected_driver_id": hired_driver,
        "shown_driver_ids": all_shown
    }
    
    response = requests.post(f"{API_URL}/api/feedback", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print(f"Success! Hired driver {hired_driver}")
        print(json.dumps(response.json(), indent=2))
    else:
        print(response.text)

if __name__ == "__main__":
    print("="*50)
    print(" Testing AutoAid Recommender API")
    print("="*50)
    
    if test_health():
        search_data = test_search()
        if search_data:
            time.sleep(1) # simulate user thinking
            test_feedback(search_data)
