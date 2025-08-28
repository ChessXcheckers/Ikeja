from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Cookie
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime

# Import models
from models.user import User, UserCreate, UserUpdate, UserInDB
from models.product import Product, ProductCreate, ProductUpdate
from models.cart import Cart, CartItem, CartCreate, CartUpdate
from models.payment import PaymentRequest, PaymentResponse, Payment
from models.tracking import TrackingEvent, EventType, SessionData

# Import services
from services.flutterwave import FlutterwaveService
from services.crypto_payment import CryptoPaymentService
from services.cart_service import CartService
from services.recommendation_service import RecommendationService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
flutterwave_service = FlutterwaveService()
crypto_service = CryptoPaymentService()

# Create the main app
app = FastAPI(title="Alibaba Clone API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Dependency to get services
async def get_cart_service():
    return CartService(db)

async def get_recommendation_service():
    return RecommendationService(db)

# Basic health check
@api_router.get("/")
async def root():
    return {"message": "Alibaba Clone API is running", "version": "1.0.0"}

# Product endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 20,
    skip: int = 0
):
    """Get products with filtering and pagination"""
    query = {"status": "active"}
    
    if category:
        query["category"] = category
    if search:
        query["$text"] = {"$search": search}
    if min_price is not None:
        query["pricing.min_price"] = {"$gte": min_price}
    if max_price is not None:
        query["pricing.max_price"] = {"$lte": max_price}
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    
    # Convert ObjectId to string and return
    for product in products:
        product["id"] = str(product["_id"])
        del product["_id"]
    
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get single product by ID"""
    product = await db.products.find_one({"_id": product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["id"] = str(product["_id"])
    del product["_id"]
    
    return Product(**product)

@api_router.get("/categories")
async def get_categories():
    """Get all product categories"""
    pipeline = [
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1},
            "subcategories": {"$addToSet": "$subcategory"}
        }},
        {"$sort": {"count": -1}}
    ]
    
    categories = await db.products.aggregate(pipeline).to_list(100)
    
    return {
        "categories": [
            {
                "name": cat["_id"],
                "count": cat["count"],
                "subcategories": cat["subcategories"]
            }
            for cat in categories
        ]
    }

# Cart endpoints
@api_router.post("/cart", response_model=Cart)
async def create_cart(
    user_id: str,
    cart_service: CartService = Depends(get_cart_service)
):
    """Create new cart for user"""
    return await cart_service.create_cart(user_id)

@api_router.get("/cart/{user_id}", response_model=Cart)
async def get_cart(
    user_id: str,
    cart_service: CartService = Depends(get_cart_service)
):
    """Get user's cart"""
    cart = await cart_service.get_cart(user_id)
    if not cart:
        # Create new cart if doesn't exist
        cart = await cart_service.create_cart(user_id)
    return cart

@api_router.post("/cart/{user_id}/items")
async def add_to_cart(
    user_id: str,
    product_id: str,
    quantity: int,
    cart_service: CartService = Depends(get_cart_service)
):
    """Add item to cart"""
    # Get product data
    product = await db.products.find_one({"_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Convert ObjectId to string
    product["id"] = str(product["_id"])
    
    return await cart_service.add_item(user_id, product_id, quantity, product)

@api_router.delete("/cart/{user_id}/items/{product_id}")
async def remove_from_cart(
    user_id: str,
    product_id: str,
    cart_service: CartService = Depends(get_cart_service)
):
    """Remove item from cart"""
    return await cart_service.remove_item(user_id, product_id)

@api_router.put("/cart/{user_id}/items/{product_id}")
async def update_cart_item(
    user_id: str,
    product_id: str,
    quantity: int,
    cart_service: CartService = Depends(get_cart_service)
):
    """Update item quantity in cart"""
    return await cart_service.update_item_quantity(user_id, product_id, quantity)

# Payment endpoints
@api_router.post("/payments/initialize", response_model=PaymentResponse)
async def initialize_payment(payment_request: PaymentRequest):
    """Initialize payment with Flutterwave or crypto"""
    
    if payment_request.payment_method == "crypto":
        if not payment_request.crypto_payment:
            raise HTTPException(status_code=400, detail="Crypto payment details required")
        
        return await crypto_service.initialize_crypto_payment(
            payment_request.amount,
            payment_request.currency,
            payment_request.crypto_payment.crypto_method
        )
    else:
        return await flutterwave_service.initialize_payment(payment_request)

@api_router.get("/payments/verify/{transaction_id}")
async def verify_payment(transaction_id: str, payment_method: str = "flutterwave"):
    """Verify payment status"""
    
    if payment_method == "crypto":
        # For crypto, we need to know the crypto method
        # This would typically be stored when payment is initialized
        from models.payment import CryptoPaymentMethod
        return await crypto_service.verify_crypto_payment(transaction_id, CryptoPaymentMethod.BITCOIN)
    else:
        return await flutterwave_service.verify_payment(transaction_id)

@api_router.get("/payments/crypto/supported")
async def get_supported_cryptocurrencies():
    """Get supported cryptocurrency methods"""
    return crypto_service.get_supported_cryptocurrencies()

# User tracking and recommendations
@api_router.post("/tracking/event")
async def track_event(
    event: TrackingEvent,
    recommendation_service: RecommendationService = Depends(get_recommendation_service)
):
    """Track user event for recommendations"""
    
    # Save event to database
    await db.tracking_events.insert_one(event.dict())
    
    # Track product interactions
    if event.event_type in ["product_view", "cart_add"]:
        product_id = event.properties.get("product_id")
        if product_id:
            await recommendation_service.track_interaction(
                product_id=product_id,
                user_id=event.user_id,
                session_id=event.session_id,
                interaction_type=event.event_type.replace("_", ""),
                duration=event.properties.get("duration")
            )
    
    return {"status": "success", "message": "Event tracked"}

@api_router.get("/recommendations/{user_id}")
async def get_user_recommendations(
    user_id: str,
    session_id: Optional[str] = None,
    limit: int = 10,
    recommendation_service: RecommendationService = Depends(get_recommendation_service)
):
    """Get personalized recommendations for user"""
    
    recommendations = await recommendation_service.generate_recommendations(
        user_id=user_id,
        session_id=session_id,
        limit=limit
    )
    
    # Get product details for recommendations
    product_ids = [rec.product_id for rec in recommendations]
    products = await db.products.find({"_id": {"$in": product_ids}}).to_list(len(product_ids))
    
    # Map products to recommendations
    product_map = {str(p["_id"]): p for p in products}
    
    result = []
    for rec in recommendations:
        if rec.product_id in product_map:
            product = product_map[rec.product_id]
            product["id"] = str(product["_id"])
            del product["_id"]
            
            result.append({
                "product": Product(**product),
                "score": rec.score,
                "reasons": rec.reasons,
                "confidence": rec.confidence
            })
    
    return {"recommendations": result}

@api_router.get("/recommendations/session/{session_id}")
async def get_session_recommendations(
    session_id: str,
    limit: int = 10,
    recommendation_service: RecommendationService = Depends(get_recommendation_service)
):
    """Get recommendations based on session activity"""
    
    recommendations = await recommendation_service.generate_recommendations(
        session_id=session_id,
        limit=limit
    )
    
    # Get product details
    product_ids = [rec.product_id for rec in recommendations]
    products = await db.products.find({"_id": {"$in": product_ids}}).to_list(len(product_ids))
    
    product_map = {str(p["_id"]): p for p in products}
    
    result = []
    for rec in recommendations:
        if rec.product_id in product_map:
            product = product_map[rec.product_id]
            product["id"] = str(product["_id"])
            del product["_id"]
            
            result.append({
                "product": Product(**product),
                "score": rec.score,
                "reasons": rec.reasons
            })
    
    return {"recommendations": result}

# Search with recommendations
@api_router.get("/search")
async def search_products(
    q: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    limit: int = 20,
    recommendation_service: RecommendationService = Depends(get_recommendation_service)
):
    """Search products with personalized ranking"""
    
    # Basic text search
    products = await db.products.find({
        "$text": {"$search": q},
        "status": "active"
    }).limit(limit).to_list(limit)
    
    # Track search event
    if user_id or session_id:
        search_event = TrackingEvent(
            session_id=session_id or "anonymous",
            user_id=user_id,
            event_type=EventType.SEARCH,
            page_url="/search",
            properties={"query": q, "results_count": len(products)}
        )
        await db.tracking_events.insert_one(search_event.dict())
    
    # Convert products
    for product in products:
        product["id"] = str(product["_id"])
        del product["_id"]
    
    return {
        "query": q,
        "products": [Product(**product) for product in products],
        "count": len(products)
    }

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting Alibaba Clone API...")
    
    # Create indexes
    await db.products.create_index([("name", "text"), ("description", "text")])
    await db.products.create_index("category")
    await db.products.create_index("status")
    await db.carts.create_index("user_id")
    await db.tracking_events.create_index([("user_id", 1), ("timestamp", -1)])
    await db.tracking_events.create_index([("session_id", 1), ("timestamp", -1)])
    
    logger.info("Database indexes created successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Cleanup on shutdown"""
    client.close()
    logger.info("Database connection closed")