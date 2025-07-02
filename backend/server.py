from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from pymongo import MongoClient
import uuid
from email_validator import validate_email, EmailNotValidError

# Environment variables
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

# MongoDB setup
client = MongoClient(MONGO_URL)
db = client.ikeja_ecommerce
users_collection = db.users
products_collection = db.products
orders_collection = db.orders
carts_collection = db.carts
reviews_collection = db.reviews

# FastAPI app
app = FastAPI(title="Ikeja E-commerce API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    full_name: str
    created_at: datetime = Field(default_factory=datetime.now)
    is_active: bool = True

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str
    brand: str
    images: List[str]
    specs: Dict[str, Any]
    stock_quantity: int
    is_featured: bool = False
    rating: float = 0.0
    review_count: int = 0
    created_at: datetime = Field(default_factory=datetime.now)
    tags: List[str] = []

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    total_amount: float
    updated_at: datetime = Field(default_factory=datetime.now)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    total_amount: float
    status: str = "pending"
    payment_method: str
    shipping_address: Dict[str, str]
    created_at: datetime = Field(default_factory=datetime.now)

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=datetime.now)
    verified_purchase: bool = False

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user_id = verify_jwt_token(credentials.credentials)
    user = users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Initialize sample data
def init_sample_data():
    if products_collection.count_documents({}) == 0:
        sample_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "iPhone 15 Pro Max",
                "description": "Experience the extraordinary. The iPhone 15 Pro Max features a titanium design, A17 Pro chip, and our most advanced camera system ever. Capture stunning photos and videos, enjoy all-day battery life, and elevate your mobile experience to new heights.",
                "price": 1199.99,
                "original_price": 1299.99,
                "category": "smartphones",
                "brand": "Apple",
                "images": [
                    "https://images.unsplash.com/photo-1555375771-14b2a63968a9",
                    "https://images.pexels.com/photos/3707744/pexels-photo-3707744.jpeg"
                ],
                "specs": {
                    "display": "6.7-inch Super Retina XDR",
                    "storage": "256GB",
                    "camera": "48MP Main + 12MP Ultra Wide + 12MP Telephoto",
                    "battery": "All-day battery life",
                    "processor": "A17 Pro chip"
                },
                "stock_quantity": 15,
                "is_featured": True,
                "rating": 4.8,
                "review_count": 234,
                "created_at": datetime.now(),
                "tags": ["premium", "flagship", "camera", "gaming"]
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Samsung Galaxy S24 Ultra",
                "description": "Unleash your creativity with Galaxy AI. The S24 Ultra combines cutting-edge AI capabilities with a stunning 6.8-inch display and S Pen precision. Capture professional-quality photos, enjoy seamless multitasking, and experience the future of mobile innovation.",
                "price": 1099.99,
                "original_price": 1199.99,
                "category": "smartphones",
                "brand": "Samsung",
                "images": [
                    "https://images.pexels.com/photos/32780501/pexels-photo-32780501.jpeg",
                    "https://images.unsplash.com/photo-1599482883682-16b1acef228d"
                ],
                "specs": {
                    "display": "6.8-inch Dynamic AMOLED 2X",
                    "storage": "512GB",
                    "camera": "200MP Main + 50MP Periscope + 12MP Ultra Wide",
                    "battery": "5000mAh",
                    "processor": "Snapdragon 8 Gen 3"
                },
                "stock_quantity": 8,
                "is_featured": True,
                "rating": 4.7,
                "review_count": 189,
                "created_at": datetime.now(),
                "tags": ["AI", "s-pen", "camera", "productivity"]
            },
            {
                "id": str(uuid.uuid4()),
                "name": "SteelSeries Arctis 7P+ Wireless",
                "description": "Immerse yourself in legendary audio. The Arctis 7P+ delivers premium wireless gaming audio with lossless 2.4GHz connection, 30-hour battery life, and ClearCast microphone. Experience every detail, communicate with crystal clarity, and dominate the competition.",
                "price": 169.99,
                "original_price": 199.99,
                "category": "gaming",
                "brand": "SteelSeries",
                "images": [
                    "https://images.unsplash.com/photo-1677086813101-496813a0f327",
                    "https://images.unsplash.com/photo-1600186279172-fdbaefd74383"
                ],
                "specs": {
                    "connectivity": "2.4GHz Wireless + 3.5mm",
                    "battery": "30+ hours",
                    "microphone": "ClearCast bidirectional",
                    "drivers": "40mm neodymium",
                    "weight": "355g"
                },
                "stock_quantity": 23,
                "is_featured": False,
                "rating": 4.6,
                "review_count": 156,
                "created_at": datetime.now(),
                "tags": ["wireless", "gaming", "comfort", "long-battery"]
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Razer DeathAdder V3 Pro",
                "description": "Precision redefined. The DeathAdder V3 Pro features Focus Pro 30K sensor, ultra-lightweight design, and HyperSpeed wireless technology. Achieve unparalleled accuracy, enjoy ergonomic comfort, and experience the competitive edge that legends are made of.",
                "price": 149.99,
                "original_price": 179.99,
                "category": "gaming",
                "brand": "Razer",
                "images": [
                    "https://images.unsplash.com/photo-1600186279172-fdbaefd74383",
                    "https://images.unsplash.com/photo-1677086813101-496813a0f327"
                ],
                "specs": {
                    "sensor": "Focus Pro 30K",
                    "dpi": "30,000 DPI",
                    "battery": "90 hours",
                    "switches": "Razer Optical Mouse Switches",
                    "weight": "63g"
                },
                "stock_quantity": 12,
                "is_featured": False,
                "rating": 4.9,
                "review_count": 87,
                "created_at": datetime.now(),
                "tags": ["pro-gaming", "lightweight", "precision", "wireless"]
            }
        ]
        products_collection.insert_many(sample_products)

# API Routes
@app.on_event("startup")
async def startup_event():
    init_sample_data()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# Auth routes
@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    try:
        validate_email(user_data.email)
    except EmailNotValidError:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    if users_collection.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name
    )
    
    users_collection.insert_one(user.dict())
    token = create_jwt_token(user.id)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    user = users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["id"])
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }

# Product routes
@app.get("/api/products")
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    
    products = list(products_collection.find(query, {"_id": 0}))
    return {"products": products}

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    product = products_collection.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get reviews for this product
    reviews = list(reviews_collection.find({"product_id": product_id}, {"_id": 0}))
    product["reviews"] = reviews
    
    return product

# Cart routes
@app.get("/api/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart = carts_collection.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not cart:
        cart = {"user_id": current_user["id"], "items": [], "total_amount": 0}
    return cart

@app.post("/api/cart/add")
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    # Verify product exists
    product = products_collection.find_one({"id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get or create cart
    cart = carts_collection.find_one({"user_id": current_user["id"]})
    if not cart:
        cart = {"user_id": current_user["id"], "items": [], "total_amount": 0}
    
    # Update cart items
    existing_item = None
    for cart_item in cart["items"]:
        if cart_item["product_id"] == item.product_id:
            existing_item = cart_item
            break
    
    if existing_item:
        existing_item["quantity"] += item.quantity
    else:
        cart["items"].append(item.dict())
    
    # Recalculate total
    cart["total_amount"] = sum(item["price"] * item["quantity"] for item in cart["items"])
    cart["updated_at"] = datetime.now()
    
    carts_collection.replace_one({"user_id": current_user["id"]}, cart, upsert=True)
    
    return {"message": "Item added to cart", "cart": cart}

@app.delete("/api/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    cart = carts_collection.find_one({"user_id": current_user["id"]})
    if not cart:
        return {"message": "Cart is empty", "cart": {"user_id": current_user["id"], "items": [], "total_amount": 0}}
    
    original_length = len(cart["items"])
    cart["items"] = [item for item in cart["items"] if item["product_id"] != product_id]
    
    if len(cart["items"]) == original_length:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    cart["total_amount"] = sum(item["price"] * item["quantity"] for item in cart["items"])
    cart["updated_at"] = datetime.now()
    
    carts_collection.replace_one({"user_id": current_user["id"]}, cart)
    
    return {"message": "Item removed from cart", "cart": cart}

# Order routes
@app.post("/api/orders")
async def create_order(order_data: Order, current_user: dict = Depends(get_current_user)):
    order_data.user_id = current_user["id"]
    order_data.id = str(uuid.uuid4())
    order_data.created_at = datetime.now()
    
    orders_collection.insert_one(order_data.dict())
    
    # Clear cart after order
    carts_collection.delete_one({"user_id": current_user["id"]})
    
    return {"message": "Order created successfully", "order_id": order_data.id}

@app.get("/api/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    orders = list(orders_collection.find({"user_id": current_user["id"]}, {"_id": 0}))
    return {"orders": orders}

# Review routes
@app.post("/api/reviews")
async def create_review(review_data: Review, current_user: dict = Depends(get_current_user)):
    review_data.user_id = current_user["id"]
    review_data.id = str(uuid.uuid4())
    review_data.created_at = datetime.now()
    
    reviews_collection.insert_one(review_data.dict())
    
    # Update product rating
    reviews = list(reviews_collection.find({"product_id": review_data.product_id}))
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    products_collection.update_one(
        {"id": review_data.product_id},
        {"$set": {"rating": round(avg_rating, 1), "review_count": len(reviews)}}
    )
    
    return {"message": "Review created successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)