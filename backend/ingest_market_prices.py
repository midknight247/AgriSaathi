import csv
from datetime import datetime
from pathlib import Path

from sqlalchemy import text

from database import SessionLocal


CSV_FILE = Path(__file__).parent / "sample_market_prices.csv"


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


def parse_price(value: str) -> float:
    value = value.strip()

    if not value:
        raise ValueError("Price cannot be empty")

    price = float(value)

    if price < 0:
        raise ValueError("Price cannot be negative")

    return price


def main():
    if not CSV_FILE.exists():
        raise FileNotFoundError(
            f"CSV file not found: {CSV_FILE}"
        )

    inserted_or_updated = 0

    with CSV_FILE.open(
        mode="r",
        encoding="utf-8-sig",
        newline=""
    ) as file:
        reader = csv.DictReader(file)

        required_columns = {
            "State",
            "District",
            "Market",
            "Commodity",
            "Variety",
            "Arrival Date",
            "Min X0020 Price",
            "Max X0020 Price",
            "Modal X0020 Price",
        }

        missing_columns = required_columns - set(reader.fieldnames or [])

        if missing_columns:
            raise ValueError(
                f"Missing CSV columns: {sorted(missing_columns)}"
            )

        with SessionLocal() as db:
            for row_number, row in enumerate(reader, start=2):
                crop_name = row["Commodity"].strip()
                variety = row["Variety"].strip() or "Other"
                market_name = row["Market"].strip()
                district = row["District"].strip()
                state = row["State"].strip()

                if not crop_name:
                    raise ValueError(
                        f"Row {row_number}: Commodity is empty"
                    )

                if not market_name:
                    raise ValueError(
                        f"Row {row_number}: Market is empty"
                    )

                if not district:
                    raise ValueError(
                        f"Row {row_number}: District is empty"
                    )

                if not state:
                    raise ValueError(
                        f"Row {row_number}: State is empty"
                    )

                price_date = datetime.strptime(
                    row["Arrival Date"].strip(),
                    "%d/%m/%Y"
                ).date()

                min_price = parse_price(row["Min X0020 Price"])
                max_price = parse_price(row["Max X0020 Price"])
                modal_price = parse_price(row["Modal X0020 Price"])

                if min_price > max_price:
                    raise ValueError(
                        f"Row {row_number}: Minimum price is greater than maximum price"
                    )

                if not min_price <= modal_price <= max_price:
                    raise ValueError(
                        f"Row {row_number}: Modal price is outside the minimum and maximum range"
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

            db.commit()

    print(
        f"Successfully inserted or updated "
        f"{inserted_or_updated} market-price rows."
    )


if __name__ == "__main__":
    main()