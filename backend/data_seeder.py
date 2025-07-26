import asyncio
import random
from motor.motor_asyncio import AsyncIOMotorClient
from models.product import Product, ProductCategory, ProductImage, ProductPricing, SupplierInfo, ProductVariant
from models.user import User, UserRole, UserPreferences, UserProfile
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Sample data
SAMPLE_PRODUCTS = [
    {
        "name": "Premium Wireless Headphones",
        "description": "High-quality wireless headphones with noise cancellation technology, perfect for professional use and music listening.",
        "category": ProductCategory.ELECTRONICS,
        "subcategory": "Audio & Video",
        "images": [
            ProductImage(url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", alt="Wireless Headphones", is_primary=True),
            ProductImage(url="https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400", alt="Headphones Side View")
        ],
        "pricing": ProductPricing(min_price=25.0, max_price=45.0, currency="USD"),
        "min_order_quantity": 100,
        "supplier": SupplierInfo(
            id="supplier_001",
            name="Shenzhen Tech Co., Ltd.",
            country="China",
            verification_status=True,
            trade_assurance=True,
            response_rate=95.0,
            rating=4.8
        ),
        "variants": [
            ProductVariant(name="Color", value="Black"),
            ProductVariant(name="Color", value="White", price_adjustment=2.0)
        ],
        "specifications": {
            "Battery Life": "30 hours",
            "Connectivity": "Bluetooth 5.0",
            "Weight": "250g"
        },
        "tags": ["wireless", "headphones", "audio", "bluetooth"]
    },
    {
        "name": "Cotton T-Shirts Bulk Order",
        "description": "Premium quality cotton t-shirts available in various colors and sizes. Perfect for retail businesses and promotional campaigns.",
        "category": ProductCategory.APPAREL,
        "subcategory": "Men's Clothing",
        "images": [
            ProductImage(url="https://images.unsplash.com/photo-1521497361130-eea3b8c96e4d?w=400", alt="Cotton T-Shirt", is_primary=True),
            ProductImage(url="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400", alt="Colorful T-Shirts")
        ],
        "pricing": ProductPricing(min_price=3.50, max_price=8.00, currency="USD"),
        "min_order_quantity": 500,
        "supplier": SupplierInfo(
            id="supplier_002",
            name="Guangzhou Apparel Factory",
            country="China",
            verification_status=True,
            trade_assurance=True,
            response_rate=92.0,
            rating=4.6
        ),
        "variants": [
            ProductVariant(name="Size", value="S"),
            ProductVariant(name="Size", value="M"),
            ProductVariant(name="Size", value="L"),
            ProductVariant(name="Color", value="White"),
            ProductVariant(name="Color", value="Black", price_adjustment=0.5)
        ],
        "specifications": {
            "Material": "100% Cotton",
            "GSM": "180",
            "Fit": "Regular"
        },
        "tags": ["cotton", "t-shirt", "apparel", "bulk"]
    },
    {
        "name": "Industrial CNC Machine Parts",
        "description": "High-precision CNC machined parts for industrial applications. Custom manufacturing available with strict quality control.",
        "category": ProductCategory.MACHINERY,
        "subcategory": "Manufacturing Equipment",
        "images": [
            ProductImage(url="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400", alt="CNC Machine Parts", is_primary=True),
            ProductImage(url="https://images.unsplash.com/photo-1717386255773-1e3037c81788?w=400", alt="Industrial Machinery")
        ],
        "pricing": ProductPricing(min_price=120.0, max_price=280.0, currency="USD"),
        "min_order_quantity": 50,
        "supplier": SupplierInfo(
            id="supplier_003",
            name="Beijing Manufacturing Ltd.",
            country="China",
            verification_status=True,
            trade_assurance=False,
            response_rate=88.0,
            rating=4.5
        ),
        "specifications": {
            "Material": "Stainless Steel",
            "Tolerance": "±0.01mm",
            "Surface Finish": "Ra 0.8"
        },
        "tags": ["cnc", "machinery", "industrial", "precision"]
    },
    {
        "name": "Modern Office Chair",
        "description": "Ergonomic office chair with lumbar support and adjustable height. Perfect for modern workspaces and home offices.",
        "category": ProductCategory.HOME_GARDEN,
        "subcategory": "Furniture",
        "images": [
            ProductImage(url="https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400", alt="Office Chair", is_primary=True),
            ProductImage(url="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", alt="Modern Furniture")
        ],
        "pricing": ProductPricing(min_price=85.0, max_price=150.0, currency="USD"),
        "min_order_quantity": 20,
        "supplier": SupplierInfo(
            id="supplier_004",
            name="Foshan Furniture Co.",
            country="China",
            verification_status=False,
            trade_assurance=True,
            response_rate=90.0,
            rating=4.3
        ),
        "variants": [
            ProductVariant(name="Color", value="Black"),
            ProductVariant(name="Color", value="Gray", price_adjustment=5.0),
            ProductVariant(name="Material", value="Mesh Back"),
            ProductVariant(name="Material", value="Leather", price_adjustment=25.0)
        ],
        "specifications": {
            "Weight Capacity": "120kg",
            "Dimensions": "65x65x110cm",
            "Material": "Mesh/Leather"
        },
        "tags": ["office", "chair", "furniture", "ergonomic"]
    },
    {
        "name": "Premium Skincare Set",
        "description": "Complete skincare routine set with cleanser, toner, serum, and moisturizer. Suitable for all skin types with natural ingredients.",
        "category": ProductCategory.BEAUTY,
        "subcategory": "Skincare",
        "images": [
            ProductImage(url="https://images.unsplash.com/photo-1676570092589-a6c09ecbb373?w=400", alt="Skincare Products", is_primary=True),
            ProductImage(url="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400", alt="Beauty Products")
        ],
        "pricing": ProductPricing(min_price=15.0, max_price=35.0, currency="USD"),
        "min_order_quantity": 200,
        "supplier": SupplierInfo(
            id="supplier_005",
            name="Korean Beauty Co.",
            country="South Korea",
            verification_status=True,
            trade_assurance=True,
            response_rate=96.0,
            rating=4.9
        ),
        "specifications": {
            "Volume": "50ml each",
            "Ingredients": "Natural extracts",
            "Shelf Life": "24 months"
        },
        "tags": ["skincare", "beauty", "cosmetics", "natural"]
    },
    {
        "name": "Warehouse Storage Racks",
        "description": "Heavy-duty storage racks for warehouse and industrial use. Modular design with high load capacity and easy assembly.",
        "category": ProductCategory.LOGISTICS,
        "subcategory": "Storage Solutions",
        "images": [
            ProductImage(url="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400", alt="Warehouse Storage", is_primary=True),
            ProductImage(url="https://images.unsplash.com/photo-1664382953403-fc1ac77073a0?w=400", alt="Storage Facility")
        ],
        "pricing": ProductPricing(min_price=200.0, max_price=500.0, currency="USD"),
        "min_order_quantity": 10,
        "supplier": SupplierInfo(
            id="supplier_006",
            name="Shanghai Logistics Equipment",
            country="China",
            verification_status=True,
            trade_assurance=True,
            response_rate=87.0,
            rating=4.4
        ),
        "specifications": {
            "Load Capacity": "2000kg per level",
            "Material": "Steel",
            "Dimensions": "2x1x3m"
        },
        "tags": ["warehouse", "storage", "logistics", "industrial"]
    }
]

async def seed_products():
    """Seed database with sample products"""
    print("Seeding products...")
    
    # Clear existing products
    await db.products.delete_many({})
    
    for product_data in SAMPLE_PRODUCTS:
        # Generate random view counts and inquiry counts
        product_data.update({
            "view_count": random.randint(100, 5000),
            "inquiry_count": random.randint(10, 500),
            "status": "active"
        })
        
        product = Product(**product_data)
        await db.products.insert_one(product.dict())
    
    print(f"Seeded {len(SAMPLE_PRODUCTS)} products")

async def seed_users():
    """Seed database with sample users"""
    print("Seeding users...")
    
    # Clear existing users
    await db.users.delete_many({})
    
    sample_users = [
        {
            "email": "buyer1@example.com",
            "full_name": "John Smith",
            "role": UserRole.BUYER,
            "company": "Tech Solutions Inc.",
            "country": "United States",
            "preferences": UserPreferences(
                categories=["electronics", "machinery"],
                price_range={"min": 50, "max": 1000},
                currency="USD"
            )
        },
        {
            "email": "supplier1@example.com",
            "full_name": "Wang Li",
            "role": UserRole.SUPPLIER,
            "company": "Shenzhen Manufacturing",
            "country": "China",
            "preferences": UserPreferences(
                categories=["electronics", "apparel"],
                currency="USD"
            )
        }
    ]
    
    for user_data in sample_users:
        user = User(**user_data)
        await db.users.insert_one(user.dict())
    
    print(f"Seeded {len(sample_users)} users")

async def main():
    """Run all seeding operations"""
    print("Starting database seeding...")
    
    await seed_products()
    await seed_users()
    
    print("Database seeding completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())