from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from decimal import Decimal
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not configured")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)

from database import get_db

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")
        role = payload.get("role")

        if user_id is None or role is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token"
        )

    user = db.execute(
        text("""
            SELECT
                id,
                role,
                full_name,
                phone_number,
                email,
                is_active
            FROM users
            WHERE id = :user_id
        """),
        {"user_id": user_id}
    ).mappings().first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    return dict(user)


app = FastAPI(title="AgriSaathi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ListingCreate(BaseModel):
    crop_name: str
    variety: str | None = None
    description: str | None = None
    quantity_kg: float
    expected_price_per_kg: float
    pickup_district: str
    pickup_village: str

class OfferCreate(BaseModel):
    listing_id: str
    offered_price_per_kg: float
    offered_quantity_kg: float
    message: str | None = None

class UserCreate(BaseModel):
    role: str
    full_name: str
    phone_number: str = Field(pattern=r"^[6-9][0-9]{9}$")
    password: str = Field(min_length=8)
    email: str | None = None
    village: str | None = None
    district: str | None = None
    state: str | None = None
    organization_name: str | None = None


class UserLogin(BaseModel):
    phone_number: str = Field(pattern=r"^[6-9][0-9]{9}$")
    password: str


@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if user.role not in ["farmer", "buyer"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be farmer or buyer"
        )

    existing_user = db.execute(
        text("""
            SELECT id
            FROM users
            WHERE phone_number = :phone_number
        """),
        {"phone_number": user.phone_number}
    ).fetchone()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Phone number already registered"
        )

    password_hash = hash_password(user.password)

    new_user_id = str(uuid.uuid4())

    db.execute(
        text("""
            INSERT INTO users (
                id,
                role,
                full_name,
                phone_number,
                password_hash,
                email,
                village,
                district,
                state,
                organization_name,
                is_demo_account,
                is_active
            )
            VALUES (
                :id,
                :role,
                :full_name,
                :phone_number,
                :password_hash,
                :email,
                :village,
                :district,
                :state,
                :organization_name,
                false,
                true
            )
        """),
        {
            "id": new_user_id,
            "role": user.role,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "password_hash": password_hash,
            "email": user.email,
            "village": user.village,
            "district": user.district,
            "state": user.state,
            "organization_name": user.organization_name
        }
    )

    db.commit()

    return {
        "message": "Registration successful",
        "user": {
            "id": new_user_id,
            "role": user.role,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email
        }
    }


@app.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    result = db.execute(
        text("""
            SELECT
                id,
                role,
                full_name,
                phone_number,
                password_hash,
                email,
                is_active
            FROM users
            WHERE phone_number = :phone_number
        """),
        {
            "phone_number": user.phone_number
        }
    )

    existing_user = result.mappings().first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid phone number or password"
        )

    if not verify_password(
        user.password,
        existing_user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid phone number or password"
        )

    if not existing_user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data = {
        "sub": str(existing_user["id"]),
        "role": existing_user["role"],
        "exp": expire
    }

    access_token = jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(existing_user["id"]),
            "role": existing_user["role"],
            "full_name": existing_user["full_name"],
            "phone_number": existing_user["phone_number"],
            "email": existing_user["email"]
        }
    }

class UserLogin(BaseModel):
    phone_number: str = Field(pattern=r"^[6-9][0-9]{9}$")
    password: str

@app.get("/admin/users")
def get_all_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can view users"
        )

    query = text(
        """
        SELECT
            id,
            role,
            full_name,
            phone_number,
            email,
            village,
            district,
            state,
            organization_name,
            is_demo_account,
            is_active,
            created_at
        FROM users
        ORDER BY created_at DESC
        """
    )

    results = db.execute(query).mappings().all()

    users = []

    for row in results:
        user = dict(row)

        user["id"] = str(user["id"])

        user["created_at"] = (
            user["created_at"].isoformat()
            if user["created_at"]
            else None
        )

        users.append(user)

    return {
        "count": len(users),
        "users": users
    }

@app.get("/")
def root():
    return {
        "message": "AgriSaathi backend is running"
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

@app.get("/my-listings")
def get_my_listings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "farmer":
        raise HTTPException(
            status_code=403,
            detail="Only farmers can view their listings"
        )

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
            listing_status,
            created_at
        FROM produce_listings
        WHERE farmer_id = :farmer_id
        ORDER BY created_at DESC
    """)

    result = db.execute(
        query,
        {"farmer_id": str(current_user["id"])}
    )

    listings = []

    for row in result.mappings():
        listing = dict(row)

        listing["id"] = str(listing["id"])
        listing["farmer_id"] = str(listing["farmer_id"])

        if listing["harvest_date"]:
            listing["harvest_date"] = (
                listing["harvest_date"].isoformat()
            )

        if listing["created_at"]:
            listing["created_at"] = (
                listing["created_at"].isoformat()
            )

        listings.append(listing)

    return {
        "count": len(listings),
        "listings": listings
    }

@app.post("/listings")
def create_listing(
    listing: ListingCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "farmer":
        raise HTTPException(
            status_code=403,
            detail="Only farmers can create listings"
        )

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
        {
            "farmer_id": str(current_user["id"]),
            "crop_name": listing.crop_name,
            "variety": listing.variety,
            "description": listing.description,
            "quantity_kg": listing.quantity_kg,
            "expected_price_per_kg": listing.expected_price_per_kg,
            "pickup_district": listing.pickup_district,
            "pickup_village": listing.pickup_village
        }
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
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can submit offers"
        )

    listing_query = text("""
        SELECT
            id,
            listing_status
        FROM produce_listings
        WHERE id = :listing_id
    """)

    listing = db.execute(
        listing_query,
        {
            "listing_id": offer.listing_id
        }
    ).mappings().first()

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found"
        )

    if listing["listing_status"] != "active":
        raise HTTPException(
            status_code=400,
            detail="This listing is not active"
        )

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
        {
            "listing_id": offer.listing_id,
            "buyer_id": str(current_user["id"]),
            "offered_price_per_kg": offer.offered_price_per_kg,
            "offered_quantity_kg": offer.offered_quantity_kg,
            "message": offer.message
        }
    )

    new_offer_id = result.scalar_one()

    db.commit()

    return {
        "message": "Offer submitted successfully",
        "offer_id": str(new_offer_id)
    }

@app.get("/my-offers")
def get_my_offers(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can view their offers"
        )

    buyer_id = str(current_user["id"])

    query = text("""
        SELECT
            o.id,
            o.listing_id,
            o.buyer_id,
            o.offered_price_per_kg,
            o.offered_quantity_kg,
            o.offer_status,
            o.message,
            o.created_at,
            o.updated_at,
            l.crop_name,
            l.variety,
            l.pickup_district,
            l.pickup_village
        FROM buyer_offers o
        JOIN produce_listings l
            ON o.listing_id = l.id
        WHERE o.buyer_id = :buyer_id
        ORDER BY o.created_at DESC
    """)

    results = db.execute(
        query,
        {"buyer_id": buyer_id}
    ).mappings().all()

    offers = []

    for row in results:
        offer = dict(row)

        offer["id"] = str(offer["id"])
        offer["listing_id"] = str(offer["listing_id"])
        offer["buyer_id"] = str(offer["buyer_id"])

        offer["created_at"] = (
            offer["created_at"].isoformat()
            if offer["created_at"]
            else None
        )

        offer["updated_at"] = (
            offer["updated_at"].isoformat()
            if offer["updated_at"]
            else None
        )

        offers.append(offer)

    return {
        "count": len(offers),
        "offers": offers
    }

@app.get("/listings/{listing_id}/offers")
def get_listing_offers(
    listing_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing_query = text("""
        SELECT id, farmer_id
        FROM produce_listings
        WHERE id = :listing_id
    """)

    listing = db.execute(
        listing_query,
        {"listing_id": listing_id}
    ).mappings().first()

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found"
        )

    if str(current_user["id"]) != str(listing["farmer_id"]):
        raise HTTPException(
            status_code=403,
            detail="You do not own this listing"
        )

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
    current_user: dict = Depends(get_current_user),
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

        if str(current_user["id"]) != str(listing["farmer_id"]):
            db.rollback()
            raise HTTPException(
                status_code=403,
                detail="You do not own this listing"
            )

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

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print("Accept offer error:", e)
        return {"error": "Could not accept offer"}

@app.get("/transactions")
def get_my_transactions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = str(current_user["id"])
    role = current_user["role"]

    if role == "buyer":
        query = text("""
            SELECT
                t.id,
                t.listing_id,
                t.offer_id,
                t.farmer_id,
                t.buyer_id,
                pl.crop_name,
                pl.variety,
                t.final_price_per_kg,
                t.final_quantity_kg,
                t.total_amount,
                t.transaction_status,
                t.payment_status,
                t.created_at,
                t.updated_at
            FROM transactions t
            JOIN produce_listings pl
                ON t.listing_id = pl.id
            WHERE t.buyer_id = :user_id
            ORDER BY t.created_at DESC
        """)

    elif role == "farmer":
        query = text("""
            SELECT
                t.id,
                t.listing_id,
                t.offer_id,
                t.farmer_id,
                t.buyer_id,
                pl.crop_name,
                pl.variety,
                t.final_price_per_kg,
                t.final_quantity_kg,
                t.total_amount,
                t.transaction_status,
                t.payment_status,
                t.created_at,
                t.updated_at
            FROM transactions t
            JOIN produce_listings pl
                ON t.listing_id = pl.id
            WHERE t.farmer_id = :user_id
            ORDER BY t.created_at DESC
        """)

    else:
        raise HTTPException(
            status_code=403,
            detail="Only farmers and buyers can view transactions"
        )

    results = db.execute(
        query,
        {"user_id": user_id}
    ).mappings().all()

    transactions = []

    for row in results:
        transaction = dict(row)

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

        transactions.append(transaction)

    return {
        "count": len(transactions),
        "transactions": transactions
    }

@app.get("/transactions/{transaction_id}")
def get_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user),
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
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    transaction = dict(result)

    # Only the farmer or buyer involved in the transaction
    # can view it.
    user_id = str(current_user["id"])

    if (
        user_id != str(transaction["farmer_id"])
        and user_id != str(transaction["buyer_id"])
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this transaction"
        )

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
    from_date: str | None = None,
    to_date: str | None = None,
    db: Session = Depends(get_db)
):
    # Validate date filters before sending them to PostgreSQL.
    if from_date:
        try:
            datetime.strptime(from_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="from_date must use YYYY-MM-DD format"
            )

    if to_date:
        try:
            datetime.strptime(to_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="to_date must use YYYY-MM-DD format"
            )

    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=400,
            detail="from_date cannot be later than to_date"
        )

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
        query += " AND LOWER(crop_name) = LOWER(:crop_name)"
        params["crop_name"] = crop_name

    if district:
        query += " AND LOWER(district) = LOWER(:district)"
        params["district"] = district

    if market_name:
        query += " AND LOWER(market_name) = LOWER(:market_name)"
        params["market_name"] = market_name

    if from_date:
        query += " AND price_date >= CAST(:from_date AS DATE)"
        params["from_date"] = from_date

    if to_date:
        query += " AND price_date <= CAST(:to_date AS DATE)"
        params["to_date"] = to_date

    query += """
        ORDER BY price_date DESC, modal_price_per_quintal DESC
    """

    result = db.execute(text(query), params)

    return [dict(row._mapping) for row in result]

@app.get("/price-intelligence")
def get_price_intelligence(
    crop_name: str,
    district: str | None = None,
    expected_price_per_kg: float | None = None,
    db: Session = Depends(get_db)
):
    crop_name = crop_name.strip()

    if not crop_name:
        raise HTTPException(
            status_code=400,
            detail="crop_name is required"
        )

    query = """
        WITH latest_date AS (
            SELECT MAX(price_date) AS price_date
            FROM market_prices
            WHERE LOWER(crop_name) = LOWER(:crop_name)
        ),
        current_prices AS (
            SELECT
                crop_name,
                variety,
                market_name,
                district,
                state,
                price_date,
                min_price_per_quintal,
                max_price_per_quintal,
                modal_price_per_quintal
            FROM market_prices
            WHERE LOWER(crop_name) = LOWER(:crop_name)
              AND price_date = (SELECT price_date FROM latest_date)
        )
        SELECT
            crop_name,
            variety,
            market_name,
            district,
            state,
            price_date,
            min_price_per_quintal,
            max_price_per_quintal,
            modal_price_per_quintal
        FROM current_prices
    """

    params = {
        "crop_name": crop_name
    }

    if district:
        query += """
            WHERE LOWER(district) = LOWER(:district)
        """
        params["district"] = district.strip()

    query += """
        ORDER BY modal_price_per_quintal DESC NULLS LAST
    """

    result = db.execute(text(query), params)
    rows = [dict(row._mapping) for row in result]

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No current market price data found for {crop_name}"
        )

    modal_prices = [
        float(row["modal_price_per_quintal"]) / 100
        for row in rows
        if row["modal_price_per_quintal"] is not None
    ]

    min_prices = [
        float(row["min_price_per_quintal"]) / 100
        for row in rows
        if row["min_price_per_quintal"] is not None
    ]

    max_prices = [
        float(row["max_price_per_quintal"]) / 100
        for row in rows
        if row["max_price_per_quintal"] is not None
    ]

    average_modal_price_per_kg = (
        sum(modal_prices) / len(modal_prices)
        if modal_prices
        else None
    )

    lowest_modal_price_per_kg = (
        min(modal_prices)
        if modal_prices
        else None
    )

    highest_modal_price_per_kg = (
        max(modal_prices)
        if modal_prices
        else None
    )

    intelligence = {
        "crop_name": rows[0]["crop_name"],
        "latest_date": rows[0]["price_date"],
        "market_count": len(rows),
        "reference": "Current mandi modal-price snapshot",
        "average_modal_price_per_kg": average_modal_price_per_kg,
        "lowest_modal_price_per_kg": (
            min(modal_prices) if modal_prices else None
        ),
        "highest_modal_price_per_kg": (
            max(modal_prices) if modal_prices else None
        ),
        "lowest_market_range_price_per_kg": (
            min(min_prices) if min_prices else None
        ),
        "highest_market_range_price_per_kg": (
            max(max_prices) if max_prices else None
        ),
        "expected_price_per_kg": expected_price_per_kg,
        "expected_price_difference_per_kg": None,
        "expected_price_difference_percent": None,
        "markets": []
    }

    if (
        expected_price_per_kg is not None
        and average_modal_price_per_kg is not None
    ):
        difference = (
            expected_price_per_kg
            - average_modal_price_per_kg
        )

        intelligence["expected_price_difference_per_kg"] = difference

        if average_modal_price_per_kg > 0:
            intelligence["expected_price_difference_percent"] = (
                difference / average_modal_price_per_kg
            ) * 100

    for row in rows:
        intelligence["markets"].append({
            "market_name": row["market_name"],
            "district": row["district"],
            "state": row["state"],
            "price_date": row["price_date"],
            "modal_price_per_kg": (
                float(row["modal_price_per_quintal"]) / 100
                if row["modal_price_per_quintal"] is not None
                else None
            ),
            "min_price_per_kg": (
                float(row["min_price_per_quintal"]) / 100
                if row["min_price_per_quintal"] is not None
                else None
            ),
            "max_price_per_kg": (
                float(row["max_price_per_quintal"]) / 100
                if row["max_price_per_quintal"] is not None
                else None
            )
        })

        intelligence["top_markets"] = [
        {
            "market_name": row["market_name"].strip(),
            "district": row["district"].strip(),
            "modal_price_per_kg": (
                float(row["modal_price_per_quintal"]) / 100
                if row["modal_price_per_quintal"] is not None
                else None
            )
        }
        for row in rows[:5]
    ]

    return intelligence

class LogisticsProviderCreate(BaseModel):
    provider_name: str
    phone_number: str = Field(pattern=r"^[6-9][0-9]{9}$")
    district: str
    service_area: str | None = None
    vehicle_type: str | None = None
    capacity_kg: Decimal | None = None
    estimated_cost: Decimal | None = None

class UserCreate(BaseModel):
    role: str
    full_name: str
    phone_number: str = Field(pattern=r"^[6-9][0-9]{9}$")
    password: str = Field(min_length=8)
    email: str | None = None
    village: str | None = None
    district: str | None = None
    state: str | None = None
    organization_name: str | None = None


@app.post("/logistics-providers")
def create_logistics_provider(
    provider: LogisticsProviderCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only administrators can create logistics-provider records.
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only administrators can create logistics providers"
        )

    allowed_vehicle_types = {
        "mini_truck",
        "tempo",
        "truck",
        "tractor_trolley",
    }

    if (
        provider.vehicle_type is not None
        and provider.vehicle_type not in allowed_vehicle_types
    ):
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid vehicle_type",
                "allowed_vehicle_types": sorted(allowed_vehicle_types),
            },
        )

    if provider.capacity_kg is not None and provider.capacity_kg <= 0:
        raise HTTPException(
            status_code=400,
            detail="capacity_kg must be greater than zero"
        )

    if provider.estimated_cost is not None and provider.estimated_cost < 0:
        raise HTTPException(
            status_code=400,
            detail="estimated_cost cannot be negative"
        )

    query = text(
        """
        INSERT INTO logistics_providers (
            provider_name,
            phone_number,
            district,
            service_area,
            vehicle_type,
            capacity_kg,
            estimated_cost,
            is_demo_record,
            is_active
        )
        VALUES (
            :provider_name,
            :phone_number,
            :district,
            :service_area,
            :vehicle_type,
            :capacity_kg,
            :estimated_cost,
            TRUE,
            TRUE
        )
        RETURNING
            id,
            provider_name,
            phone_number,
            district,
            service_area,
            vehicle_type,
            capacity_kg,
            estimated_cost,
            is_demo_record,
            is_active,
            created_at
        """
    )

    result = db.execute(
        query,
        {
            "provider_name": provider.provider_name,
            "phone_number": provider.phone_number,
            "district": provider.district,
            "service_area": provider.service_area,
            "vehicle_type": provider.vehicle_type,
            "capacity_kg": provider.capacity_kg,
            "estimated_cost": provider.estimated_cost,
        }
    )

    provider_record = dict(result.fetchone()._mapping)

    db.commit()

    return provider_record

class PickupRequestCreate(BaseModel):
    transaction_id: str
    logistics_provider_id: str
    pickup_location: str | None = None
    delivery_location: str | None = None
    pickup_date: str | None = None
    notes: str | None = None

@app.get("/pickup-requests")
def get_pickup_requests(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = str(current_user["id"])
    role = current_user["role"]

    if role not in {"farmer", "buyer"}:
        raise HTTPException(
            status_code=403,
            detail="Only farmers and buyers can view pickup requests"
        )

    query = text(
        """
        SELECT
            pr.id,
            pr.transaction_id,
            pr.logistics_provider_id,
            lp.provider_name AS logistics_provider_name,
            pr.pickup_location,
            pr.delivery_location,
            pr.pickup_date,
            pr.request_status,
            pr.notes,
            pr.created_at,
            pr.updated_at,
            t.farmer_id,
            t.buyer_id
        FROM pickup_requests pr
        JOIN transactions t 
            ON t.id = pr.transaction_id
        LEFT JOIN logistics_providers lp
            ON lp.id = pr.logistics_provider_id
        WHERE
            t.farmer_id = :user_id
            OR t.buyer_id = :user_id
        ORDER BY pr.created_at DESC
        """
    )

    results = db.execute(
        query,
        {"user_id": user_id}
    ).mappings().all()

    pickup_requests = []

    for row in results:
        request = dict(row)

        request["id"] = str(request["id"])
        request["transaction_id"] = str(request["transaction_id"])
        request["logistics_provider_id"] = (
            str(request["logistics_provider_id"])
            if request["logistics_provider_id"]
            else None
        )
        request["farmer_id"] = str(request["farmer_id"])
        request["buyer_id"] = str(request["buyer_id"])

        request["pickup_date"] = (
            request["pickup_date"].isoformat()
            if request["pickup_date"]
            else None
        )

        request["created_at"] = (
            request["created_at"].isoformat()
            if request["created_at"]
            else None
        )

        request["updated_at"] = (
            request["updated_at"].isoformat()
            if request["updated_at"]
            else None
        )

        pickup_requests.append(request)

    return {
        "count": len(pickup_requests),
        "pickup_requests": pickup_requests
    }

@app.post("/pickup-requests")
def create_pickup_request(
    pickup: PickupRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Get transaction and verify that the logged-in user
    #    is either the farmer or buyer involved in it.
    transaction_query = text(
        """
        SELECT
            id,
            farmer_id,
            buyer_id,
            transaction_status,
            final_quantity_kg
        FROM transactions
        WHERE id = :transaction_id
        """
    )

    transaction_result = db.execute(
        transaction_query,
        {"transaction_id": pickup.transaction_id}
    ).mappings().first()

    if not transaction_result:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    user_id = str(current_user["id"])

    if (
        user_id != str(transaction_result["farmer_id"])
        and user_id != str(transaction_result["buyer_id"])
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this transaction"
        )

    # 2. Pickup is allowed only for confirmed transactions.
    if transaction_result["transaction_status"] != "confirmed":
        raise HTTPException(
            status_code=400,
            detail="Pickup can only be requested for a confirmed transaction"
        )

    # 3. Verify logistics provider.
    provider_query = text(
        """
        SELECT
            id,
            is_active,
            capacity_kg
        FROM logistics_providers
        WHERE id = :provider_id
        """
    )

    provider_result = db.execute(
        provider_query,
        {"provider_id": pickup.logistics_provider_id}
    ).mappings().first()

    if not provider_result:
        raise HTTPException(
            status_code=404,
            detail="Logistics provider not found"
        )

    if not provider_result["is_active"]:
        raise HTTPException(
            status_code=400,
            detail="Logistics provider is inactive"
        )

    if (
        provider_result["capacity_kg"] is not None
        and provider_result["capacity_kg"] < transaction_result["final_quantity_kg"]
    ):
        raise HTTPException(
            status_code=400,
            detail="Logistics provider capacity is insufficient"
        )

    # 4. Prevent duplicate pickup requests.
    existing_query = text(
        """
        SELECT id
        FROM pickup_requests
        WHERE transaction_id = :transaction_id
        """
    )

    existing_request = db.execute(
        existing_query,
        {"transaction_id": pickup.transaction_id}
    ).fetchone()

    if existing_request:
        return {
            "message": "A pickup request already exists for this transaction",
            "pickup_request_id": str(existing_request.id),
        }

    # 5. Create pickup request.
    insert_query = text(
        """
        INSERT INTO pickup_requests (
            transaction_id,
            logistics_provider_id,
            pickup_location,
            delivery_location,
            pickup_date,
            request_status,
            notes
        )
        VALUES (
            :transaction_id,
            :provider_id,
            :pickup_location,
            :delivery_location,
            CAST(:pickup_date AS DATE),
            'requested',
            :notes
        )
        RETURNING
            id,
            transaction_id,
            logistics_provider_id,
            pickup_location,
            delivery_location,
            pickup_date,
            request_status,
            notes,
            created_at
        """
    )

    result = db.execute(
        insert_query,
        {
            "transaction_id": pickup.transaction_id,
            "provider_id": pickup.logistics_provider_id,
            "pickup_location": pickup.pickup_location,
            "delivery_location": pickup.delivery_location,
            "pickup_date": pickup.pickup_date,
            "notes": pickup.notes,
        }
    )

    pickup_record = dict(result.fetchone()._mapping)

    db.commit()

    return pickup_record

class PickupStatusUpdate(BaseModel):
    request_status: str


@app.patch("/pickup-requests/{pickup_request_id}/status")
def update_pickup_status(
    pickup_request_id: str,
    status_update: PickupStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed_statuses = {
        "requested",
        "confirmed",
        "completed",
        "cancelled",
    }

    if status_update.request_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid request_status",
                "allowed_statuses": sorted(allowed_statuses),
            },
        )

    # Get pickup request and the transaction participants.
    query = text(
        """
        SELECT
            pr.id,
            pr.transaction_id,
            pr.logistics_provider_id,
            pr.request_status,
            pr.pickup_location,
            pr.delivery_location,
            pr.pickup_date,
            pr.notes,
            pr.created_at,
            pr.updated_at,
            t.farmer_id,
            t.buyer_id
        FROM pickup_requests pr
        JOIN transactions t
            ON t.id = pr.transaction_id
        WHERE pr.id = :pickup_request_id
        """
    )

    result = db.execute(
        query,
        {"pickup_request_id": pickup_request_id}
    ).mappings().first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Pickup request not found"
        )

    # Only the farmer or buyer involved in the transaction
    # can update the pickup status.
    user_id = str(current_user["id"])

    if (
        user_id != str(result["farmer_id"])
        and user_id != str(result["buyer_id"])
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this pickup request"
        )

    current_status = result["request_status"]
    new_status = status_update.request_status

    allowed_transitions = {
        "requested": {"confirmed", "cancelled"},
        "confirmed": {"completed", "cancelled"},
        "completed": set(),
        "cancelled": set(),
    }

    if new_status not in allowed_transitions[current_status]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change pickup request from "
                f"'{current_status}' to '{new_status}'"
            ),
        )

    update_query = text(
        """
        UPDATE pickup_requests
        SET
            request_status = :request_status,
            updated_at = now()
        WHERE id = :pickup_request_id
        RETURNING
            id,
            transaction_id,
            logistics_provider_id,
            pickup_location,
            delivery_location,
            pickup_date,
            request_status,
            notes,
            created_at,
            updated_at
        """
    )

    updated_result = db.execute(
        update_query,
        {
            "request_status": new_status,
            "pickup_request_id": pickup_request_id,
        }
    )

    pickup_record = dict(updated_result.fetchone()._mapping)

    db.commit()

    return pickup_record

class PickupProviderUpdate(BaseModel):
    logistics_provider_id: str


@app.patch("/pickup-requests/{pickup_request_id}/provider")
def assign_logistics_provider(
    pickup_request_id: str,
    provider_update: PickupProviderUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get pickup request together with the transaction participants.
    pickup_query = text(
        """
        SELECT
            pr.id,
            pr.transaction_id,
            pr.logistics_provider_id,
            pr.request_status,
            t.farmer_id,
            t.buyer_id
        FROM pickup_requests pr
        JOIN transactions t
            ON t.id = pr.transaction_id
        WHERE pr.id = :pickup_request_id
        """
    )

    pickup_result = db.execute(
        pickup_query,
        {"pickup_request_id": pickup_request_id}
    ).mappings().first()

    if not pickup_result:
        raise HTTPException(
            status_code=404,
            detail="Pickup request not found"
        )

    # Only the farmer or buyer involved in the transaction
    # can assign/reassign the logistics provider.
    user_id = str(current_user["id"])

    if (
        user_id != str(pickup_result["farmer_id"])
        and user_id != str(pickup_result["buyer_id"])
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this pickup request"
        )

    if pickup_result["request_status"] in {"completed", "cancelled"}:
        raise HTTPException(
            status_code=400,
            detail="Cannot reassign a completed or cancelled pickup request"
        )

    # Verify the new logistics provider.
    provider_query = text(
        """
        SELECT
            id,
            provider_name,
            is_active,
            capacity_kg
        FROM logistics_providers
        WHERE id = :provider_id
        """
    )

    provider_result = db.execute(
        provider_query,
        {"provider_id": provider_update.logistics_provider_id}
    ).mappings().first()

    if not provider_result:
        raise HTTPException(
            status_code=404,
            detail="Logistics provider not found"
        )

    if not provider_result["is_active"]:
        raise HTTPException(
            status_code=400,
            detail="Logistics provider is inactive"
        )

    # Get transaction quantity for capacity validation.
    transaction_query = text(
        """
        SELECT final_quantity_kg
        FROM transactions
        WHERE id = :transaction_id
        """
    )

    transaction_result = db.execute(
        transaction_query,
        {"transaction_id": pickup_result["transaction_id"]}
    ).mappings().first()

    if not transaction_result:
        raise HTTPException(
            status_code=404,
            detail="Linked transaction not found"
        )

    if (
        provider_result["capacity_kg"] is not None
        and provider_result["capacity_kg"]
        < transaction_result["final_quantity_kg"]
    ):
        raise HTTPException(
            status_code=400,
            detail="Logistics provider capacity is insufficient"
        )

    # Assign the provider.
    update_query = text(
        """
        UPDATE pickup_requests
        SET
            logistics_provider_id = :provider_id,
            updated_at = now()
        WHERE id = :pickup_request_id
        RETURNING
            id,
            transaction_id,
            logistics_provider_id,
            pickup_location,
            delivery_location,
            pickup_date,
            request_status,
            notes,
            created_at,
            updated_at
        """
    )

    updated_result = db.execute(
        update_query,
        {
            "provider_id": provider_update.logistics_provider_id,
            "pickup_request_id": pickup_request_id,
        }
    )

    pickup_record = dict(updated_result.fetchone()._mapping)

    db.commit()

    return pickup_record