from fastapi import Depends, FastAPI, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db


app = FastAPI(title="AgriSaathi API")


class ListingCreate(BaseModel):
    farmer_id: str
    crop_name: str
    variety: str | None = None
    description: str | None = None
    quantity_kg: float
    expected_price_per_kg: float
    pickup_district: str
    pickup_village: str


class OfferCreate(BaseModel):
    listing_id: str
    buyer_id: str
    offered_price_per_kg: float
    offered_quantity_kg: float
    message: str | None = None


@app.get("/")
def root():
    return {
        "message": "AgriSaathi backend is running"
    }


@app.get("/db-test")
def database_test(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))

    return {
        "database": "connected",
        "result": result.scalar()
    }


@app.get("/listings")
def get_listings(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            id,
            farmer_id,
            crop_name,
            variety,
            description,
            quantity_kg,
            expected_price_per_kg,
            harvest_date,
            pickup_district,
            pickup_village,
            listing_status
        FROM produce_listings
        WHERE listing_status = 'active'
        ORDER BY created_at DESC
    """)

    result = db.execute(query)

    listings = []

    for row in result.mappings():
        listing = dict(row)

        listing["id"] = str(listing["id"])
        listing["farmer_id"] = str(listing["farmer_id"])

        if listing["harvest_date"]:
            listing["harvest_date"] = (
                listing["harvest_date"].isoformat()
            )

        listings.append(listing)

    return {
        "count": len(listings),
        "listings": listings
    }


@app.post("/listings")
def create_listing(
    listing: ListingCreate,
    db: Session = Depends(get_db)
):
    query = text("""
        INSERT INTO produce_listings (
            farmer_id,
            crop_name,
            variety,
            description,
            quantity_kg,
            expected_price_per_kg,
            pickup_district,
            pickup_village,
            listing_status
        )
        VALUES (
            :farmer_id,
            :crop_name,
            :variety,
            :description,
            :quantity_kg,
            :expected_price_per_kg,
            :pickup_district,
            :pickup_village,
            'active'
        )
        RETURNING id
    """)

    result = db.execute(
        query,
        listing.model_dump()
    )

    new_listing_id = result.scalar_one()

    db.commit()

    return {
        "message": "Listing created successfully",
        "listing_id": str(new_listing_id)
    }


@app.post("/offers")
def create_offer(
    offer: OfferCreate,
    db: Session = Depends(get_db)
):
    listing_query = text("""
        SELECT
            id,
            listing_status
        FROM produce_listings
        WHERE id = :listing_id
    """)

    listing = db.execute(
        listing_query,
        {"listing_id": offer.listing_id}
    ).mappings().first()

    if listing is None:
        return {
            "error": "Listing not found"
        }

    if listing["listing_status"] != "active":
        return {
            "error": "This listing is not active"
        }

    offer_query = text("""
        INSERT INTO buyer_offers (
            listing_id,
            buyer_id,
            offered_price_per_kg,
            offered_quantity_kg,
            offer_status,
            message
        )
        VALUES (
            :listing_id,
            :buyer_id,
            :offered_price_per_kg,
            :offered_quantity_kg,
            'pending',
            :message
        )
        RETURNING id
    """)

    result = db.execute(
        offer_query,
        offer.model_dump()
    )

    new_offer_id = result.scalar_one()

    db.commit()

    return {
        "message": "Offer submitted successfully",
        "offer_id": str(new_offer_id)
    }


@app.get("/listings/{listing_id}/offers")
def get_listing_offers(
    listing_id: str,
    db: Session = Depends(get_db)
):
    query = text("""
        SELECT
            id,
            listing_id,
            buyer_id,
            offered_price_per_kg,
            offered_quantity_kg,
            offer_status,
            message,
            created_at
        FROM buyer_offers
        WHERE listing_id = :listing_id
        ORDER BY offered_price_per_kg DESC, created_at DESC
    """)

    result = db.execute(
        query,
        {"listing_id": listing_id}
    )

    offers = []

    for row in result.mappings():
        offer = dict(row)

        offer["id"] = str(offer["id"])
        offer["listing_id"] = str(offer["listing_id"])
        offer["buyer_id"] = str(offer["buyer_id"])

        offer["created_at"] = (
            offer["created_at"].isoformat()
            if offer["created_at"]
            else None
        )

        offers.append(offer)

    return {
        "listing_id": listing_id,
        "count": len(offers),
        "offers": offers
    }


@app.post("/offers/{offer_id}/accept")
def accept_offer(
    offer_id: str,
    db: Session = Depends(get_db)
):
    try:
        # Step 1: Find which listing this offer belongs to.
        # This is only a reference lookup, not the locking step.
        offer_reference_query = text("""
            SELECT listing_id
            FROM buyer_offers
            WHERE id = :offer_id
        """)

        offer_reference = db.execute(
            offer_reference_query,
            {"offer_id": offer_id}
        ).mappings().first()

        if offer_reference is None:
            db.rollback()
            return {
                "error": "Offer not found"
            }

        listing_id = str(offer_reference["listing_id"])

        # Step 2: Lock the listing first.
        # Every acceptance request for the same listing must pass
        # through this lock before modifying offers.
        listing_query = text("""
            SELECT
                id,
                farmer_id,
                quantity_kg,
                listing_status
            FROM produce_listings
            WHERE id = :listing_id
            FOR UPDATE
        """)

        listing = db.execute(
            listing_query,
            {"listing_id": listing_id}
        ).mappings().first()

        if listing is None:
            db.rollback()
            return {
                "error": "Listing not found"
            }

        if listing["listing_status"] != "active":
            db.rollback()
            return {
                "error": "Listing is no longer active"
            }

        # Step 3: Lock the specific offer after the listing lock.
        # Re-read the offer because its status may have changed
        # since the initial reference lookup.
        offer_query = text("""
            SELECT
                id,
                listing_id,
                buyer_id,
                offered_price_per_kg,
                offered_quantity_kg,
                offer_status
            FROM buyer_offers
            WHERE id = :offer_id
              AND listing_id = :listing_id
            FOR UPDATE
        """)

        offer = db.execute(
            offer_query,
            {
                "offer_id": offer_id,
                "listing_id": listing_id
            }
        ).mappings().first()

        if offer is None:
            db.rollback()
            return {
                "error": "Offer not found"
            }

        if offer["offer_status"] != "pending":
            db.rollback()
            return {
                "error": "Offer is not pending"
            }

        # Step 4: Mark the selected offer as accepted.
        accept_offer_query = text("""
            UPDATE buyer_offers
            SET
                offer_status = 'accepted',
                updated_at = NOW()
            WHERE id = :offer_id
        """)

        db.execute(
            accept_offer_query,
            {"offer_id": offer_id}
        )

        # Step 5: Reject all other pending offers for this listing.
        reject_other_offers_query = text("""
            UPDATE buyer_offers
            SET
                offer_status = 'rejected',
                updated_at = NOW()
            WHERE listing_id = :listing_id
              AND id <> :offer_id
              AND offer_status = 'pending'
        """)

        db.execute(
            reject_other_offers_query,
            {
                "listing_id": listing_id,
                "offer_id": offer_id
            }
        )

        # Step 6: Create the transaction.
        # Do not insert total_amount because PostgreSQL generates it.
        transaction_query = text("""
            INSERT INTO transactions (
                listing_id,
                offer_id,
                farmer_id,
                buyer_id,
                final_price_per_kg,
                final_quantity_kg,
                transaction_status
            )
            VALUES (
                :listing_id,
                :offer_id,
                :farmer_id,
                :buyer_id,
                :final_price_per_kg,
                :final_quantity_kg,
                'confirmed'
            )
            RETURNING id
        """)

        transaction_id = db.execute(
            transaction_query,
            {
                "listing_id": listing_id,
                "offer_id": offer_id,
                "farmer_id": str(listing["farmer_id"]),
                "buyer_id": str(offer["buyer_id"]),
                "final_price_per_kg": offer["offered_price_per_kg"],
                "final_quantity_kg": offer["offered_quantity_kg"]
            }
        ).scalar_one()

        # Step 7: Mark the listing as sold.
        update_listing_query = text("""
            UPDATE produce_listings
            SET
                listing_status = 'sold',
                updated_at = NOW()
            WHERE id = :listing_id
        """)

        db.execute(
            update_listing_query,
            {"listing_id": listing_id}
        )

        # Step 8: Commit the entire workflow atomically.
        db.commit()

        return {
            "message": "Offer accepted successfully",
            "transaction_id": str(transaction_id),
            "listing_id": listing_id,
            "offer_id": offer_id,
            "status": "confirmed"
        }

    except Exception:
        db.rollback()

        return {
            "error": "Could not accept offer"
        }

@app.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    query = text("""
        SELECT
            id,
            listing_id,
            offer_id,
            farmer_id,
            buyer_id,
            final_price_per_kg,
            final_quantity_kg,
            total_amount,
            transaction_status,
            payment_status,
            created_at,
            updated_at
        FROM transactions
        WHERE id = :transaction_id
    """)

    result = db.execute(
        query,
        {"transaction_id": transaction_id}
    ).mappings().first()

    if result is None:
        return {
            "error": "Transaction not found"
        }

    transaction = dict(result)

    transaction["id"] = str(transaction["id"])
    transaction["listing_id"] = str(transaction["listing_id"])
    transaction["offer_id"] = str(transaction["offer_id"])
    transaction["farmer_id"] = str(transaction["farmer_id"])
    transaction["buyer_id"] = str(transaction["buyer_id"])

    transaction["created_at"] = (
        transaction["created_at"].isoformat()
        if transaction["created_at"]
        else None
    )

    transaction["updated_at"] = (
        transaction["updated_at"].isoformat()
        if transaction["updated_at"]
        else None
    )

    return transaction

@app.get("/market-prices")
def get_market_prices(
    crop_name: str | None = None,
    district: str | None = None,
    market_name: str | None = None,
    db: Session = Depends(get_db)
):
    query = """
        SELECT
            id,
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
        FROM market_prices
        WHERE 1 = 1
    """

    params = {}

    if crop_name:
        query += " AND crop_name = :crop_name"
        params["crop_name"] = crop_name

    if district:
        query += " AND district = :district"
        params["district"] = district

    if market_name:
        query += " AND market_name = :market_name"
        params["market_name"] = market_name

    query += """
        ORDER BY price_date DESC, modal_price_per_quintal DESC
    """

    result = db.execute(text(query), params)

    return [dict(row._mapping) for row in result]