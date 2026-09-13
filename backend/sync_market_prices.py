import json
import os
import sys
import time
from datetime import datetime

import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
API_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

MAX_RETRIES = 4
REQUEST_TIMEOUT = 180


def fetch_market_prices():
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

    api_key = os.getenv("DATA_GOV_API_KEY")
    database_url = os.getenv("DATABASE_URL")

    if not api_key:
        print("ERROR: DATA_GOV_API_KEY is missing")
        sys.exit(1)

    if not database_url:
        print("ERROR: DATABASE_URL is missing")
        sys.exit(1)

    url = (
        f"{API_URL}"
        f"?api-key={api_key}"
        f"&format=json"
        f"&limit=1000"
        f"&filters[state.keyword]=Maharashtra"
    )

    print("Fetching Maharashtra market prices from Data.gov.in...")

    data = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(
                url,
                timeout=REQUEST_TIMEOUT
            )

            if response.status_code in (502, 503, 504):
                print(
                    f"Data.gov.in returned HTTP {response.status_code}. "
                    f"Attempt {attempt}/{MAX_RETRIES}."
                )

                if attempt < MAX_RETRIES:
                    wait_seconds = 2 ** attempt
                    print(f"Retrying in {wait_seconds} seconds...")
                    time.sleep(wait_seconds)
                    continue

                print("ERROR: Data.gov.in remained unavailable after retries.")
                sys.exit(1)

            response.raise_for_status()

            try:
                data = response.json()
            except ValueError:
                print("ERROR: Data.gov.in returned invalid JSON")
                print(response.text[:1000])
                sys.exit(1)

            break

        except requests.Timeout:
            print(
                f"Data.gov.in request timed out. "
                f"Attempt {attempt}/{MAX_RETRIES}."
            )

            if attempt < MAX_RETRIES:
                wait_seconds = 2 ** attempt
                print(f"Retrying in {wait_seconds} seconds...")
                time.sleep(wait_seconds)
            else:
                print("ERROR: Data.gov.in timed out after retries.")
                sys.exit(1)

        except requests.RequestException as e:
            print(
                f"Data.gov.in request failed: "
                f"{type(e).__name__}"
            )
            sys.exit(1)

    if not data:
        print("ERROR: No response data received")
        sys.exit(1)

    records = data.get("records", [])

    if not records:
        print("ERROR: No Maharashtra market-price records returned")
        print(json.dumps(data, indent=2)[:2000])
        sys.exit(1)

    print(f"Total records available in API: {data.get('total')}")
    print(f"Maharashtra records fetched: {len(records)}")

    engine = create_engine(database_url)

    inserted = 0
    updated = 0
    skipped = 0

    with engine.begin() as db:
        for record in records:
            commodity = record.get("commodity")
            variety = record.get("variety")
            market = record.get("market")
            district = record.get("district")
            state = record.get("state")
            arrival_date_raw = record.get("arrival_date")

            if not commodity or not market or not district or not state:
                skipped += 1
                continue

            if not arrival_date_raw:
                skipped += 1
                continue

            try:
                price_date = datetime.strptime(
                    arrival_date_raw,
                    "%d/%m/%Y"
                ).date()
            except ValueError:
                skipped += 1
                continue

            min_price = record.get("min_price")
            max_price = record.get("max_price")
            modal_price = record.get("modal_price")

            existing = db.execute(
                text(
                    """
                    SELECT id
                    FROM market_prices
                    WHERE LOWER(crop_name) = LOWER(:crop_name)
                      AND LOWER(market_name) = LOWER(:market_name)
                      AND price_date = :price_date
                    LIMIT 1
                    """
                ),
                {
                    "crop_name": commodity,
                    "market_name": market,
                    "price_date": price_date,
                },
            ).first()

            if existing:
                db.execute(
                    text(
                        """
                        UPDATE market_prices
                        SET
                            variety = :variety,
                            district = :district,
                            state = :state,
                            min_price_per_quintal = :min_price,
                            max_price_per_quintal = :max_price,
                            modal_price_per_quintal = :modal_price,
                            source = 'agmarknet'
                        WHERE id = :id
                        """
                    ),
                    {
                        "id": existing.id,
                        "variety": variety,
                        "district": district,
                        "state": state,
                        "min_price": min_price,
                        "max_price": max_price,
                        "modal_price": modal_price,
                    },
                )
                updated += 1

            else:
                db.execute(
                    text(
                        """
                        INSERT INTO market_prices (
                            crop_name,
                            variety,
                            market_name,
                            district,
                            state,
                            price_date,
                            min_price_per_quintal,
                            max_price_per_quintal,
                            modal_price_per_quintal,
                            arrival_quantity_quintal,
                            source
                        )
                        VALUES (
                            :crop_name,
                            :variety,
                            :market_name,
                            :district,
                            :state,
                            :price_date,
                            :min_price,
                            :max_price,
                            :modal_price,
                            NULL,
                            'agmarknet'
                        )
                        """
                    ),
                    {
                        "crop_name": commodity,
                        "variety": variety,
                        "market_name": market,
                        "district": district,
                        "state": state,
                        "price_date": price_date,
                        "min_price": min_price,
                        "max_price": max_price,
                        "modal_price": modal_price,
                    },
                )
                inserted += 1

    print()
    print("Sync completed successfully.")
    print(f"Inserted: {inserted}")
    print(f"Updated:  {updated}")
    print(f"Skipped:  {skipped}")


if __name__ == "__main__":
    fetch_market_prices()