import os
import requests
import hashlib
import hmac
from typing import Dict, Any, Optional
from ..models.payment import Payment, PaymentRequest, PaymentResponse, PaymentStatus, PaymentProvider
import logging

logger = logging.getLogger(__name__)

class FlutterwaveService:
    def __init__(self):
        self.public_key = os.getenv('FLUTTERWAVE_PUBLIC_KEY', 'FLWPUBK_TEST-mock-key')
        self.secret_key = os.getenv('FLUTTERWAVE_SECRET_KEY', 'FLWSECK_TEST-mock-key')
        self.base_url = os.getenv('FLUTTERWAVE_BASE_URL', 'https://api.flutterwave.com/v3')
        self.is_mock = os.getenv('FLUTTERWAVE_MOCK', 'true').lower() == 'true'
        
    def _get_headers(self) -> Dict[str, str]:
        return {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json'
        }
    
    async def initialize_payment(self, payment_request: PaymentRequest) -> PaymentResponse:
        """Initialize payment with Flutterwave or mock response"""
        
        if self.is_mock:
            return self._mock_initialize_payment(payment_request)
            
        payload = {
            "tx_ref": f"tx_{payment_request.customer.email}_{int(datetime.now().timestamp())}",
            "amount": payment_request.amount,
            "currency": payment_request.currency,
            "redirect_url": os.getenv('FRONTEND_URL', 'http://localhost:3000') + '/payment/callback',
            "payment_options": "card,banktransfer,ussd,mobilemoney",
            "customer": {
                "email": payment_request.customer.email,
                "phonenumber": payment_request.customer.phone or "+1234567890",
                "name": payment_request.customer.name
            },
            "customizations": {
                "title": "Alibaba Clone Payment",
                "description": payment_request.description or "Product purchase",
                "logo": "https://your-logo-url.com/logo.png"
            },
            "meta": payment_request.metadata
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/payments",
                json=payload,
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    return PaymentResponse(
                        id=data['data']['id'],
                        status=PaymentStatus.PENDING,
                        payment_link=data['data']['link'],
                        message="Payment initialized successfully",
                        provider_response=data
                    )
            
            logger.error(f"Flutterwave API error: {response.text}")
            return PaymentResponse(
                id="",
                status=PaymentStatus.FAILED,
                message="Payment initialization failed",
                provider_response=response.json()
            )
            
        except Exception as e:
            logger.error(f"Flutterwave service error: {str(e)}")
            return PaymentResponse(
                id="",
                status=PaymentStatus.FAILED,
                message=f"Service error: {str(e)}"
            )
    
    def _mock_initialize_payment(self, payment_request: PaymentRequest) -> PaymentResponse:
        """Mock payment initialization for testing"""
        import uuid
        
        return PaymentResponse(
            id=str(uuid.uuid4()),
            status=PaymentStatus.PENDING,
            payment_link=f"https://checkout.flutterwave.com/v3/hosted/pay/mock_{uuid.uuid4()}",
            message="Mock payment initialized successfully",
            provider_response={
                "status": "success",
                "message": "Mock payment initialized",
                "data": {
                    "id": str(uuid.uuid4()),
                    "tx_ref": f"mock_tx_{uuid.uuid4()}",
                    "link": f"https://checkout.flutterwave.com/v3/hosted/pay/mock_{uuid.uuid4()}"
                }
            }
        )
    
    async def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Verify payment status"""
        
        if self.is_mock:
            return self._mock_verify_payment(transaction_id)
            
        try:
            response = requests.get(
                f"{self.base_url}/transactions/{transaction_id}/verify",
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            
            logger.error(f"Payment verification failed: {response.text}")
            return {"status": "error", "message": "Verification failed"}
            
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def _mock_verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Mock payment verification"""
        import random
        
        # Simulate different payment outcomes
        outcomes = ["successful", "failed", "pending"]
        status = random.choice(outcomes) if transaction_id != "test_success" else "successful"
        
        return {
            "status": "success" if status == "successful" else "error",
            "message": f"Mock verification - {status}",
            "data": {
                "id": transaction_id,
                "tx_ref": f"mock_tx_{transaction_id}",
                "amount": 100.0,
                "currency": "USD",
                "status": status,
                "customer": {
                    "email": "test@example.com",
                    "name": "Test User"
                }
            }
        }
    
    def verify_webhook(self, payload: str, signature: str) -> bool:
        """Verify webhook signature"""
        if self.is_mock:
            return True
            
        secret_hash = os.getenv('FLUTTERWAVE_SECRET_HASH', '')
        expected_signature = hmac.new(
            secret_hash.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)