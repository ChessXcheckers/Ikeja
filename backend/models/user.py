from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class UserRole(str, Enum):
    BUYER = "buyer"
    SUPPLIER = "supplier"
    ADMIN = "admin"

class PaymentMethod(str, Enum):
    CARD = "card"
    CRYPTO = "crypto"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_MONEY = "mobile_money"

class UserPreferences(BaseModel):
    categories: List[str] = []
    price_range: Dict[str, float] = {"min": 0, "max": 10000}
    preferred_suppliers: List[str] = []
    payment_methods: List[PaymentMethod] = [PaymentMethod.CARD]
    currency: str = "USD"
    language: str = "en"

class UserProfile(BaseModel):
    industry: Optional[str] = None
    company_size: Optional[str] = None
    purchase_frequency: Optional[str] = None
    avg_order_value: Optional[float] = None
    interests: List[str] = []
    behavior_score: float = 0.0
    last_activity: Optional[datetime] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.BUYER
    phone: Optional[str] = None
    company: Optional[str] = None
    country: Optional[str] = None
    preferences: UserPreferences = UserPreferences()
    profile: UserProfile = UserProfile()

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    country: Optional[str] = None
    preferences: Optional[UserPreferences] = None
    profile: Optional[UserProfile] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    is_verified: bool = False
    login_count: int = 0
    last_login: Optional[datetime] = None

class UserInDB(User):
    hashed_password: str