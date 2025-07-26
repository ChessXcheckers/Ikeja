from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class ProductStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    OUT_OF_STOCK = "out_of_stock"

class ProductCategory(str, Enum):
    ELECTRONICS = "electronics"
    APPAREL = "apparel"
    MACHINERY = "machinery"
    HOME_GARDEN = "home_garden"
    BEAUTY = "beauty"
    LOGISTICS = "logistics"

class ProductImage(BaseModel):
    url: str
    alt: str
    is_primary: bool = False

class ProductVariant(BaseModel):
    name: str
    value: str
    price_adjustment: float = 0.0

class ProductPricing(BaseModel):
    min_price: float
    max_price: float
    currency: str = "USD"
    bulk_pricing: List[Dict[str, Any]] = []

class SupplierInfo(BaseModel):
    id: str
    name: str
    country: str
    verification_status: bool = False
    trade_assurance: bool = False
    response_rate: float = 0.0
    rating: float = 0.0

class ProductBase(BaseModel):
    name: str
    description: str
    category: ProductCategory
    subcategory: str
    images: List[ProductImage] = []
    pricing: ProductPricing
    min_order_quantity: int
    supplier: SupplierInfo
    variants: List[ProductVariant] = []
    specifications: Dict[str, Any] = {}
    tags: List[str] = []

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    subcategory: Optional[str] = None
    images: Optional[List[ProductImage]] = None
    pricing: Optional[ProductPricing] = None
    min_order_quantity: Optional[int] = None
    variants: Optional[List[ProductVariant]] = None
    specifications: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    status: Optional[ProductStatus] = None

class Product(ProductBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: ProductStatus = ProductStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    view_count: int = 0
    inquiry_count: int = 0
    last_viewed: Optional[datetime] = None

class ProductInDB(Product):
    pass