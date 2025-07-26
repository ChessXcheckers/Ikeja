from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid

class PaymentMethod(str, Enum):
    CARD = "card"
    CRYPTO = "crypto"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_MONEY = "mobile_money"
    USSD = "ussd"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class CryptoPaymentMethod(str, Enum):
    BITCOIN = "bitcoin"
    ETHEREUM = "ethereum"
    USDT = "usdt"
    USDC = "usdc"

class PaymentProvider(str, Enum):
    FLUTTERWAVE = "flutterwave"
    CRYPTO_GATEWAY = "crypto_gateway"
    MOCK = "mock"

class Customer(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    name: str

class CryptoPayment(BaseModel):
    crypto_method: CryptoPaymentMethod
    wallet_address: Optional[str] = None
    network: str = "mainnet"
    gas_fee: Optional[float] = None

class FlutterwaveConfig(BaseModel):
    tx_ref: str
    amount: float
    currency: str
    redirect_url: str
    payment_options: str = "card,banktransfer,ussd"
    customer: Customer
    customizations: Dict[str, Any] = {}

class PaymentRequest(BaseModel):
    amount: float
    currency: str = "USD"
    customer: Customer
    payment_method: PaymentMethod
    description: Optional[str] = None
    metadata: Dict[str, Any] = {}
    crypto_payment: Optional[CryptoPayment] = None

class PaymentResponse(BaseModel):
    id: str
    status: PaymentStatus
    payment_link: Optional[str] = None
    crypto_address: Optional[str] = None
    qr_code: Optional[str] = None
    message: str
    provider_response: Dict[str, Any] = {}

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tx_ref: str = Field(default_factory=lambda: f"tx_{str(uuid.uuid4())[:8]}")
    amount: float
    currency: str
    customer: Customer
    payment_method: PaymentMethod
    provider: PaymentProvider
    status: PaymentStatus = PaymentStatus.PENDING
    description: Optional[str] = None
    metadata: Dict[str, Any] = {}
    crypto_payment: Optional[CryptoPayment] = None
    provider_tx_id: Optional[str] = None
    provider_response: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class PaymentInDB(Payment):
    pass