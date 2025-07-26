from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid

class EventType(str, Enum):
    PAGE_VIEW = "page_view"
    PRODUCT_VIEW = "product_view"
    CATEGORY_VIEW = "category_view"
    SEARCH = "search"
    CART_ADD = "cart_add"
    CART_REMOVE = "cart_remove"
    PURCHASE = "purchase"
    USER_REGISTER = "user_register"
    USER_LOGIN = "user_login"

class SessionData(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    ip_address: str
    user_agent: str
    country: Optional[str] = None
    city: Optional[str] = None
    referrer: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)

class TrackingEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    event_type: EventType
    page_url: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    properties: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

class UserBehavior(BaseModel):
    user_id: str
    total_page_views: int = 0
    total_product_views: int = 0
    total_searches: int = 0
    favorite_categories: List[str] = []
    average_session_duration: float = 0.0
    conversion_rate: float = 0.0
    last_seen: Optional[datetime] = None
    behavior_score: float = 0.0

class ProductInteraction(BaseModel):
    product_id: str
    user_id: Optional[str] = None
    session_id: str
    interaction_type: str  # view, like, cart_add, purchase
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration: Optional[float] = None  # time spent viewing

class RecommendationScore(BaseModel):
    product_id: str
    score: float
    reasons: List[str] = []
    confidence: float = 0.0

class UserRecommendations(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    recommendations: List[RecommendationScore] = []
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    algorithm_version: str = "v1.0"