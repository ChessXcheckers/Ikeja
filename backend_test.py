#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Alibaba.com Clone
Tests all implemented features including products, cart, payments, tracking, and recommendations
"""

import asyncio
import aiohttp
import json
import uuid
import random
from datetime import datetime
from typing import Dict, List, Any

# Get backend URL from environment
BACKEND_URL = "https://wholesale-hub-5.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.test_user_id = str(uuid.uuid4())
        self.test_session_id = str(uuid.uuid4())
        self.test_products = []
        self.test_cart_id = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
    
    async def make_request(self, method: str, endpoint: str, **kwargs) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{BACKEND_URL}{endpoint}"
        try:
            async with self.session.request(method, url, **kwargs) as response:
                try:
                    data = await response.json()
                except:
                    data = await response.text()
                return response.status < 400, data, response.status
        except Exception as e:
            return False, str(e), 0
    
    # ==================== PRODUCT MANAGEMENT TESTS ====================
    
    async def test_get_products_basic(self):
        """Test basic product retrieval"""
        success, data, status = await self.make_request("GET", "/products")
        
        if success and isinstance(data, list) and len(data) > 0:
            self.test_products = data[:3]  # Store first 3 products for later tests
            self.log_test("GET /products (basic)", True, f"Retrieved {len(data)} products")
        else:
            self.log_test("GET /products (basic)", False, f"Status: {status}, Data: {data}")
    
    async def test_get_products_with_filters(self):
        """Test product filtering"""
        # Test category filter
        success, data, status = await self.make_request("GET", "/products?category=electronics")
        if success:
            self.log_test("GET /products (category filter)", True, f"Electronics: {len(data) if isinstance(data, list) else 0} products")
        else:
            self.log_test("GET /products (category filter)", False, f"Status: {status}")
        
        # Test search filter
        success, data, status = await self.make_request("GET", "/products?search=wireless")
        if success:
            self.log_test("GET /products (search filter)", True, f"Search 'wireless': {len(data) if isinstance(data, list) else 0} products")
        else:
            self.log_test("GET /products (search filter)", False, f"Status: {status}")
        
        # Test price range filter
        success, data, status = await self.make_request("GET", "/products?min_price=10&max_price=100")
        if success:
            self.log_test("GET /products (price filter)", True, f"Price range $10-$100: {len(data) if isinstance(data, list) else 0} products")
        else:
            self.log_test("GET /products (price filter)", False, f"Status: {status}")
    
    async def test_get_single_product(self):
        """Test single product retrieval"""
        if not self.test_products:
            self.log_test("GET /products/{id}", False, "No products available for testing")
            return
        
        product_id = self.test_products[0]["id"]
        success, data, status = await self.make_request("GET", f"/products/{product_id}")
        
        if success and isinstance(data, dict) and data.get("id") == product_id:
            self.log_test("GET /products/{id}", True, f"Retrieved product: {data.get('name', 'Unknown')}")
        else:
            self.log_test("GET /products/{id}", False, f"Status: {status}, Data: {data}")
    
    async def test_get_categories(self):
        """Test category aggregation"""
        success, data, status = await self.make_request("GET", "/categories")
        
        if success and isinstance(data, dict) and "categories" in data:
            categories = data["categories"]
            self.log_test("GET /categories", True, f"Retrieved {len(categories)} categories")
        else:
            self.log_test("GET /categories", False, f"Status: {status}, Data: {data}")
    
    # ==================== CART MANAGEMENT TESTS ====================
    
    async def test_create_cart(self):
        """Test cart creation"""
        success, data, status = await self.make_request("POST", f"/cart?user_id={self.test_user_id}")
        
        if success and isinstance(data, dict) and data.get("user_id") == self.test_user_id:
            self.test_cart_id = data.get("id")
            self.log_test("POST /cart", True, f"Created cart for user: {self.test_user_id}")
        else:
            self.log_test("POST /cart", False, f"Status: {status}, Data: {data}")
    
    async def test_get_cart(self):
        """Test cart retrieval"""
        success, data, status = await self.make_request("GET", f"/cart/{self.test_user_id}")
        
        if success and isinstance(data, dict) and data.get("user_id") == self.test_user_id:
            self.log_test("GET /cart/{user_id}", True, f"Retrieved cart with {len(data.get('items', []))} items")
        else:
            self.log_test("GET /cart/{user_id}", False, f"Status: {status}, Data: {data}")
    
    async def test_add_to_cart(self):
        """Test adding items to cart"""
        if not self.test_products:
            self.log_test("POST /cart/{user_id}/items", False, "No products available for testing")
            return
        
        product_id = self.test_products[0]["id"]
        quantity = 2
        
        success, data, status = await self.make_request(
            "POST", 
            f"/cart/{self.test_user_id}/items?product_id={product_id}&quantity={quantity}"
        )
        
        if success and isinstance(data, dict):
            items = data.get("items", [])
            added_item = next((item for item in items if item["product_id"] == product_id), None)
            if added_item and added_item["quantity"] == quantity:
                self.log_test("POST /cart/{user_id}/items", True, f"Added {quantity} items to cart")
            else:
                self.log_test("POST /cart/{user_id}/items", False, "Item not found in cart or wrong quantity")
        else:
            self.log_test("POST /cart/{user_id}/items", False, f"Status: {status}, Data: {data}")
    
    async def test_update_cart_item(self):
        """Test updating cart item quantity"""
        if not self.test_products:
            self.log_test("PUT /cart/{user_id}/items/{product_id}", False, "No products available for testing")
            return
        
        product_id = self.test_products[0]["id"]
        new_quantity = 5
        
        success, data, status = await self.make_request(
            "PUT", 
            f"/cart/{self.test_user_id}/items/{product_id}?quantity={new_quantity}"
        )
        
        if success and isinstance(data, dict):
            items = data.get("items", [])
            updated_item = next((item for item in items if item["product_id"] == product_id), None)
            if updated_item and updated_item["quantity"] == new_quantity:
                self.log_test("PUT /cart/{user_id}/items/{product_id}", True, f"Updated quantity to {new_quantity}")
            else:
                self.log_test("PUT /cart/{user_id}/items/{product_id}", False, "Item not updated correctly")
        else:
            self.log_test("PUT /cart/{user_id}/items/{product_id}", False, f"Status: {status}, Data: {data}")
    
    async def test_remove_from_cart(self):
        """Test removing items from cart"""
        if not self.test_products:
            self.log_test("DELETE /cart/{user_id}/items/{product_id}", False, "No products available for testing")
            return
        
        # Add a second product first
        if len(self.test_products) > 1:
            product_id = self.test_products[1]["id"]
            await self.make_request(
                "POST", 
                f"/cart/{self.test_user_id}/items?product_id={product_id}&quantity=1"
            )
            
            # Now remove it
            success, data, status = await self.make_request(
                "DELETE", 
                f"/cart/{self.test_user_id}/items/{product_id}"
            )
            
            if success and isinstance(data, dict):
                items = data.get("items", [])
                removed_item = next((item for item in items if item["product_id"] == product_id), None)
                if not removed_item:
                    self.log_test("DELETE /cart/{user_id}/items/{product_id}", True, "Item removed successfully")
                else:
                    self.log_test("DELETE /cart/{user_id}/items/{product_id}", False, "Item still in cart")
            else:
                self.log_test("DELETE /cart/{user_id}/items/{product_id}", False, f"Status: {status}, Data: {data}")
        else:
            self.log_test("DELETE /cart/{user_id}/items/{product_id}", False, "Not enough products for testing")
    
    # ==================== PAYMENT SYSTEM TESTS ====================
    
    async def test_initialize_traditional_payment(self):
        """Test traditional payment initialization"""
        payment_data = {
            "amount": 100.0,
            "currency": "USD",
            "customer": {
                "email": "test@example.com",
                "name": "Test User",
                "phone": "+1234567890"
            },
            "payment_method": "card",
            "description": "Test payment for Alibaba clone"
        }
        
        success, data, status = await self.make_request(
            "POST", 
            "/payments/initialize",
            json=payment_data,
            headers={"Content-Type": "application/json"}
        )
        
        if success and isinstance(data, dict) and data.get("status") in ["pending", "successful"]:
            self.log_test("POST /payments/initialize (traditional)", True, f"Payment initialized: {data.get('message', '')}")
        else:
            self.log_test("POST /payments/initialize (traditional)", False, f"Status: {status}, Data: {data}")
    
    async def test_initialize_crypto_payment(self):
        """Test crypto payment initialization"""
        payment_data = {
            "amount": 50.0,
            "currency": "USD",
            "customer": {
                "email": "crypto@example.com",
                "name": "Crypto User"
            },
            "payment_method": "crypto",
            "crypto_payment": {
                "crypto_method": "bitcoin",
                "network": "testnet"
            },
            "description": "Test crypto payment"
        }
        
        success, data, status = await self.make_request(
            "POST", 
            "/payments/initialize",
            json=payment_data,
            headers={"Content-Type": "application/json"}
        )
        
        if success and isinstance(data, dict) and data.get("crypto_address"):
            self.log_test("POST /payments/initialize (crypto)", True, f"Crypto payment initialized with address: {data.get('crypto_address', '')[:20]}...")
        else:
            self.log_test("POST /payments/initialize (crypto)", False, f"Status: {status}, Data: {data}")
    
    async def test_verify_payment(self):
        """Test payment verification"""
        test_transaction_id = "test_success"
        
        success, data, status = await self.make_request("GET", f"/payments/verify/{test_transaction_id}")
        
        if success and isinstance(data, dict):
            self.log_test("GET /payments/verify/{transaction_id}", True, f"Payment verification: {data.get('status', 'unknown')}")
        else:
            self.log_test("GET /payments/verify/{transaction_id}", False, f"Status: {status}, Data: {data}")
    
    async def test_supported_cryptocurrencies(self):
        """Test supported cryptocurrencies endpoint"""
        success, data, status = await self.make_request("GET", "/payments/crypto/supported")
        
        if success and isinstance(data, dict) and "cryptocurrencies" in data:
            cryptos = data["cryptocurrencies"]
            self.log_test("GET /payments/crypto/supported", True, f"Retrieved {len(cryptos)} supported cryptocurrencies")
        else:
            self.log_test("GET /payments/crypto/supported", False, f"Status: {status}, Data: {data}")
    
    # ==================== USER TRACKING & RECOMMENDATIONS TESTS ====================
    
    async def test_track_event(self):
        """Test user event tracking"""
        if not self.test_products:
            self.log_test("POST /tracking/event", False, "No products available for testing")
            return
        
        event_data = {
            "session_id": self.test_session_id,
            "user_id": self.test_user_id,
            "event_type": "product_view",
            "page_url": "/product/123",
            "properties": {
                "product_id": self.test_products[0]["id"],
                "duration": 30.5,
                "category": "electronics"
            }
        }
        
        success, data, status = await self.make_request(
            "POST", 
            "/tracking/event",
            json=event_data,
            headers={"Content-Type": "application/json"}
        )
        
        if success and isinstance(data, dict) and data.get("status") == "success":
            self.log_test("POST /tracking/event", True, "Event tracked successfully")
        else:
            self.log_test("POST /tracking/event", False, f"Status: {status}, Data: {data}")
    
    async def test_track_cart_add_event(self):
        """Test cart add event tracking"""
        if not self.test_products:
            self.log_test("POST /tracking/event (cart_add)", False, "No products available for testing")
            return
        
        event_data = {
            "session_id": self.test_session_id,
            "user_id": self.test_user_id,
            "event_type": "cart_add",
            "page_url": "/cart",
            "properties": {
                "product_id": self.test_products[0]["id"],
                "quantity": 2,
                "price": 25.99
            }
        }
        
        success, data, status = await self.make_request(
            "POST", 
            "/tracking/event",
            json=event_data,
            headers={"Content-Type": "application/json"}
        )
        
        if success and isinstance(data, dict) and data.get("status") == "success":
            self.log_test("POST /tracking/event (cart_add)", True, "Cart add event tracked successfully")
        else:
            self.log_test("POST /tracking/event (cart_add)", False, f"Status: {status}, Data: {data}")
    
    async def test_get_user_recommendations(self):
        """Test personalized user recommendations"""
        success, data, status = await self.make_request("GET", f"/recommendations/{self.test_user_id}?limit=5")
        
        if success and isinstance(data, dict) and "recommendations" in data:
            recommendations = data["recommendations"]
            self.log_test("GET /recommendations/{user_id}", True, f"Retrieved {len(recommendations)} personalized recommendations")
        else:
            self.log_test("GET /recommendations/{user_id}", False, f"Status: {status}, Data: {data}")
    
    async def test_get_session_recommendations(self):
        """Test session-based recommendations"""
        success, data, status = await self.make_request("GET", f"/recommendations/session/{self.test_session_id}?limit=5")
        
        if success and isinstance(data, dict) and "recommendations" in data:
            recommendations = data["recommendations"]
            self.log_test("GET /recommendations/session/{session_id}", True, f"Retrieved {len(recommendations)} session recommendations")
        else:
            self.log_test("GET /recommendations/session/{session_id}", False, f"Status: {status}, Data: {data}")
    
    # ==================== SEARCH & DISCOVERY TESTS ====================
    
    async def test_search_products(self):
        """Test product search functionality"""
        search_queries = ["wireless", "cotton", "chair", "electronics"]
        
        for query in search_queries:
            success, data, status = await self.make_request("GET", f"/search?q={query}&limit=10")
            
            if success and isinstance(data, dict) and "products" in data:
                products = data["products"]
                self.log_test(f"GET /search (query: {query})", True, f"Found {len(products)} products for '{query}'")
            else:
                self.log_test(f"GET /search (query: {query})", False, f"Status: {status}, Data: {data}")
    
    async def test_search_with_user_context(self):
        """Test search with user context for personalization"""
        success, data, status = await self.make_request(
            "GET", 
            f"/search?q=headphones&user_id={self.test_user_id}&session_id={self.test_session_id}&limit=5"
        )
        
        if success and isinstance(data, dict) and "products" in data:
            products = data["products"]
            self.log_test("GET /search (with user context)", True, f"Personalized search returned {len(products)} products")
        else:
            self.log_test("GET /search (with user context)", False, f"Status: {status}, Data: {data}")
    
    # ==================== DATA INTEGRITY TESTS ====================
    
    async def test_data_integrity_products(self):
        """Test that seeded products are properly stored"""
        success, data, status = await self.make_request("GET", "/products?limit=50")
        
        if success and isinstance(data, list):
            # Check for required fields in products
            valid_products = 0
            for product in data:
                if all(key in product for key in ["id", "name", "category", "pricing", "supplier"]):
                    valid_products += 1
            
            if valid_products == len(data) and len(data) >= 6:  # We seeded 6 products
                self.log_test("Data Integrity - Products", True, f"All {len(data)} products have required fields")
            else:
                self.log_test("Data Integrity - Products", False, f"Only {valid_products}/{len(data)} products are valid")
        else:
            self.log_test("Data Integrity - Products", False, f"Status: {status}, Data: {data}")
    
    async def test_data_integrity_cart_persistence(self):
        """Test cart persistence across sessions"""
        # Get cart after adding items
        success, data, status = await self.make_request("GET", f"/cart/{self.test_user_id}")
        
        if success and isinstance(data, dict):
            items_count = len(data.get("items", []))
            summary = data.get("summary", {})
            
            if items_count > 0 and summary.get("total", 0) > 0:
                self.log_test("Data Integrity - Cart Persistence", True, f"Cart persisted with {items_count} items, total: ${summary.get('total', 0)}")
            else:
                self.log_test("Data Integrity - Cart Persistence", False, "Cart is empty or has no total")
        else:
            self.log_test("Data Integrity - Cart Persistence", False, f"Status: {status}, Data: {data}")
    
    # ==================== EDGE CASES & ERROR HANDLING TESTS ====================
    
    async def test_invalid_product_id(self):
        """Test handling of invalid product ID"""
        invalid_id = "invalid_product_id_123"
        success, data, status = await self.make_request("GET", f"/products/{invalid_id}")
        
        if status == 404:
            self.log_test("Error Handling - Invalid Product ID", True, "Correctly returned 404 for invalid product ID")
        else:
            self.log_test("Error Handling - Invalid Product ID", False, f"Expected 404, got {status}")
    
    async def test_invalid_user_cart(self):
        """Test handling of invalid user ID for cart"""
        invalid_user_id = "invalid_user_123"
        success, data, status = await self.make_request("GET", f"/cart/{invalid_user_id}")
        
        # Should create new cart or return empty cart
        if success and isinstance(data, dict):
            self.log_test("Error Handling - Invalid User Cart", True, "Handled invalid user ID gracefully")
        else:
            self.log_test("Error Handling - Invalid User Cart", False, f"Status: {status}, Data: {data}")
    
    async def test_invalid_payment_data(self):
        """Test handling of invalid payment data"""
        invalid_payment_data = {
            "amount": -100,  # Invalid negative amount
            "currency": "INVALID",
            "customer": {
                "email": "invalid-email",  # Invalid email format
                "name": ""  # Empty name
            },
            "payment_method": "invalid_method"
        }
        
        success, data, status = await self.make_request(
            "POST", 
            "/payments/initialize",
            json=invalid_payment_data,
            headers={"Content-Type": "application/json"}
        )
        
        if status >= 400:
            self.log_test("Error Handling - Invalid Payment Data", True, f"Correctly rejected invalid payment data with status {status}")
        else:
            self.log_test("Error Handling - Invalid Payment Data", False, f"Should have rejected invalid data, got status {status}")
    
    # ==================== MAIN TEST RUNNER ====================
    
    async def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend API Testing for Alibaba Clone")
        print("=" * 80)
        
        # Test API health
        success, data, status = await self.make_request("GET", "/")
        if success:
            self.log_test("API Health Check", True, f"API is running: {data.get('message', '')}")
        else:
            self.log_test("API Health Check", False, f"API not responding: {status}")
            return
        
        print("\n📦 PRODUCT MANAGEMENT TESTS")
        print("-" * 40)
        await self.test_get_products_basic()
        await self.test_get_products_with_filters()
        await self.test_get_single_product()
        await self.test_get_categories()
        
        print("\n🛒 CART MANAGEMENT TESTS")
        print("-" * 40)
        await self.test_create_cart()
        await self.test_get_cart()
        await self.test_add_to_cart()
        await self.test_update_cart_item()
        await self.test_remove_from_cart()
        
        print("\n💳 PAYMENT SYSTEM TESTS")
        print("-" * 40)
        await self.test_initialize_traditional_payment()
        await self.test_initialize_crypto_payment()
        await self.test_verify_payment()
        await self.test_supported_cryptocurrencies()
        
        print("\n📊 USER TRACKING & RECOMMENDATIONS TESTS")
        print("-" * 40)
        await self.test_track_event()
        await self.test_track_cart_add_event()
        await self.test_get_user_recommendations()
        await self.test_get_session_recommendations()
        
        print("\n🔍 SEARCH & DISCOVERY TESTS")
        print("-" * 40)
        await self.test_search_products()
        await self.test_search_with_user_context()
        
        print("\n🔒 DATA INTEGRITY TESTS")
        print("-" * 40)
        await self.test_data_integrity_products()
        await self.test_data_integrity_cart_persistence()
        
        print("\n⚠️  ERROR HANDLING TESTS")
        print("-" * 40)
        await self.test_invalid_product_id()
        await self.test_invalid_user_cart()
        await self.test_invalid_payment_data()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📋 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['details']}")
        
        print("\n🎯 CRITICAL FEATURES STATUS:")
        critical_features = {
            "Product Retrieval": any("GET /products" in r["test"] and r["success"] for r in self.test_results),
            "Cart Management": any("cart" in r["test"].lower() and r["success"] for r in self.test_results),
            "Payment Processing": any("payment" in r["test"].lower() and r["success"] for r in self.test_results),
            "User Tracking": any("tracking" in r["test"].lower() and r["success"] for r in self.test_results),
            "Recommendations": any("recommendation" in r["test"].lower() and r["success"] for r in self.test_results),
            "Search Functionality": any("search" in r["test"].lower() and r["success"] for r in self.test_results)
        }
        
        for feature, working in critical_features.items():
            status = "✅ Working" if working else "❌ Not Working"
            print(f"  {feature}: {status}")

async def main():
    """Main test runner"""
    async with BackendTester() as tester:
        await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())