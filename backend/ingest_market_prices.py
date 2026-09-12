import os
from datetime import datetime

import requests
from dotenv import load_dotenv
from sqlalchemy import text

from database import SessionLocal
import subprocess
import json

load_dotenv()


API_KEY = os.getenv("DATA_GOV_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "DATA_GOV_API_KEY is not configured in .env"
    )


API_URL = (
    "https://api.data.gov.in/resource/"
    "9ef84268-d588-465a-a308-a864a43d0070"
)


UPSERT_SQL = text(
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
    ON CONFLICT (
        crop_name,
        variety,
        market_name,
        price_date
    )
    DO UPDATE SET
        district = EXCLUDED.district,
        state = EXCLUDED.state,
        min_price_per_quintal = EXCLUDED.min_price_per_quintal,
        max_price_per_quintal = EXCLUDED.max_price_per_quintal,
        modal_price_per_quintal = EXCLUDED.modal_price_per_quintal,
        source = EXCLUDED.source
    """
)


def parse_price(value):
    if value is None or str(value).strip() == "":
        raise ValueError("Price cannot be empty")

    price = float(value)

    if price < 0:
        raise ValueError("Price cannot be negative")

    return price


def parse_date(value):
    return datetime.strptime(
        value.strip(),
        "%d/%m/%Y"
    ).date()


def main():
    print("Fetching market-price data from data.gov.in...")

    params = {
    "api-key": API_KEY,
    "format": "json",
    "limit": 100,
    "filters[state]": "Maharashtra",
    }

    query = (
    f"{API_URL}"
    f"?api-key={API_KEY}"
    f"&format=json"
    f"&limit={params['limit']}"
    f"&filters[state]=Maharashtra"
)

    result = subprocess.run(
    [
        "powershell",
        "-Command",
        f"Invoke-RestMethod -Uri '{query}' | ConvertTo-Json -Depth 10"
    ],
    capture_output=True,
    text=True,
    check=True
)

    data = json.loads(result.stdout)

    records = data.get("records", [])

    print(f"Records received: {len(records)}")

    if not records:
        print("No records received.")
        return

    inserted_or_updated = 0
    skipped = 0

    with SessionLocal() as db:

        for record_number, record in enumerate(records, start=1):
            try:
                crop_name = (
                    str(record.get("commodity") or "").strip()
                )

                variety = (
                    str(record.get("variety") or "").strip()
                    or "Other"
                )

                market_name = (
                    str(record.get("market") or "").strip()
                )

                district = (
                    str(record.get("district") or "").strip()
                )

                state = (
                    str(record.get("state") or "").strip()
                )

                arrival_date = (
                    str(record.get("arrival_date") or "").strip()
                )

                if not crop_name:
                    raise ValueError("Commodity is empty")

                if not market_name:
                    raise ValueError("Market is empty")

                if not district:
                    raise ValueError("District is empty")

                if not state:
                    raise ValueError("State is empty")

                if not arrival_date:
                    raise ValueError("Arrival date is empty")

                price_date = parse_date(arrival_date)

                min_price = parse_price(
                    record.get("min_price")
                )

                max_price = parse_price(
                    record.get("max_price")
                )

                modal_price = parse_price(
                    record.get("modal_price")
                )

                if min_price > max_price:
                    raise ValueError(
                        "Minimum price is greater than maximum price"
                    )

                if not min_price <= modal_price <= max_price:
                    raise ValueError(
                        "Modal price is outside the minimum and maximum range"
                    )

                db.execute(
                    UPSERT_SQL,
                    {
                        "crop_name": crop_name,
                        "variety": variety,
                        "market_name": market_name,
                        "district": district,
                        "state": state,
                        "price_date": price_date,
                        "min_price": min_price,
                        "max_price": max_price,
                        "modal_price": modal_price,
                    }
                )

                inserted_or_updated += 1

            except Exception as record_error:
                skipped += 1

                print(
                    f"Skipping record {record_number}: "
                    f"{record_error}"
                )

        db.commit()

    print(
        f"Successfully inserted or updated "
        f"{inserted_or_updated} market-price rows."
    )

    print(f"Skipped: {skipped}")


if __name__ == "__main__":
    main()