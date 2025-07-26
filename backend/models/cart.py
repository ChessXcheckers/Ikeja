from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class CartItemStatus(str, Enum):
    ACTIVE = "active"
    SAVED_FOR_LATER = "saved_for_later"
    REMOVED = "removed"

class CartItem(BaseModel):
    product_id: str
    product_name: str
    product_image: str
    quantity: int
    unit_price: float
    total_price: float
    currency: str = "USD"
    supplier_id: str
    supplier_name: str
    variants: dict = {}
    status: CartItemStatus = CartItemStatus.ACTIVE
    added_at: datetime = Field(default_factory=datetime.utcnow)

class CartSummary(BaseModel):
    subtotal: float
    tax: float = 0.0
    shipping: float = 0.0
    total: float
    currency: str = "USD"
    item_count: int

class CartBase(BaseModel):
    user_id: str
    items: List[CartItem] = []
    summary: CartSummary

class CartCreate(BaseModel):
    user_id: str

class CartUpdate(BaseModel):
    items: Optional[List[CartItem]] = None

class Cart(CartBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    is_persistent: bool = True

class CartInDB(Cart):
    pass