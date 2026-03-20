import json
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException


def scrape_travel_advisory():
    # Initialize Chrome browser in headless mode
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--log-level=3")

    driver = webdriver.Chrome(options=chrome_options)

    try:
        # Open the website
        driver.get("http://cpo.nhmp.gov.pk:6789/TravelAdvisory/TravelAdvisory")

        # Wait until the element with id="cards" is loaded (max 15 seconds)
        wait = WebDriverWait(driver, 15)
        wait.until(
            EC.presence_of_element_located((By.ID, "cards"))
        )

        # Find all section elements inside #cards
        cards = driver.find_elements(By.CSS_SELECTOR, "#cards section")

        if not cards:
            print(json.dumps({"success": True, "data": []}))
            return

        advisories = []

        # Loop through each advisory card
        for index, card in enumerate(cards, start=1):
            text = card.text.strip()
            if text:
                lines = text.split("\n")
                title = lines[0] if len(lines) > 0 else "Advisory"
                description = "\n".join(lines[1:]) if len(lines) > 1 else text

                advisories.append({
                    "id": index,
                    "title": title,
                    "description": description,
                    "fullText": text
                })

        print(json.dumps({"success": True, "data": advisories}))

    except TimeoutException:
        print(json.dumps({"success": False, "error": "Timed out waiting for page to load."}))
        sys.exit(1)

    except NoSuchElementException:
        print(json.dumps({"success": False, "error": "Could not find required elements on the page."}))
        sys.exit(1)

    except Exception as e:
        print(json.dumps({"success": False, "error": f"An unexpected error occurred: {str(e)}"}))
        sys.exit(1)

    finally:
        # Always close the browser
        driver.quit()


# Run the function
if __name__ == "__main__":
    scrape_travel_advisory()
