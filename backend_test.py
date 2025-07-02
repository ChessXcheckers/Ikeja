#!/usr/bin/env python3
import requests
import json
import time
import random
import string
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://dc29d596-1769-483d-808b-4e6a4c49a962.preview.emergentagent.com/api"

# Test data
TEST_USER = {
    "email": "test@ikeja.com",
    "password": "testpass123",
    "full_name": "Test User"
}

# Helper functions
def generate_random_email():
    """Generate a random email for testing"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{random_str}@ikeja.com"

def print_test_result(test_name, success, response=None, error=None):
    """Print test result in a formatted way"""
    print(f"\n{'=' * 80}")
    if success:
        print(f"✅ PASS: {test_name}")
    else:
        print(f"❌ FAIL: {test_name}")
        if error:
            print(f"Error: {error}")
    
    if response:
        try:
            print(f"Status Code: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Raw Response: {response.text}")
    print(f"{'=' * 80}\n")
    return success

def run_test_suite():
    """Run all tests and return results"""
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "auth_token": None,
        "test_product_id": None,
        "failures": []
    }
    
    # 1. Test Authentication System
    print("\n\n🔐 TESTING AUTHENTICATION SYSTEM")
    print("=" * 80)
    
    # 1.1 Test Registration with random user
    random_user = {
        "email": generate_random_email(),
        "password": "testpass123",
        "full_name": "Random Test User"
    }
    
    results["total"] += 1
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=random_user)
        success = response.status_code == 200 and "token" in response.json()
        if success:
            results["passed"] += 1
            random_token = response.json()["token"]
        else:
            results["failed"] += 1
            results["failures"].append("User Registration (Random)")
        print_test_result("User Registration (Random User)", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("User Registration (Random)")
        print_test_result("User Registration (Random User)", False, error=str(e))
    
    # 1.2 Test Registration with existing test user (might already exist)
    results["total"] += 1
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=TEST_USER)
        # Either 200 (new user) or 400 (existing user) is acceptable
        success = response.status_code in [200, 400]
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append("User Registration (Test User)")
        print_test_result("User Registration (Test User)", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("User Registration (Test User)")
        print_test_result("User Registration (Test User)", False, error=str(e))
    
    # 1.3 Test Login
    results["total"] += 1
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=TEST_USER)
        success = response.status_code == 200 and "token" in response.json()
        if success:
            results["passed"] += 1
            results["auth_token"] = response.json()["token"]
        else:
            results["failed"] += 1
            results["failures"].append("User Login")
        print_test_result("User Login", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("User Login")
        print_test_result("User Login", False, error=str(e))
    
    # 2. Test Product Catalog API
    print("\n\n📱 TESTING PRODUCT CATALOG API")
    print("=" * 80)
    
    # 2.1 Get All Products
    results["total"] += 1
    try:
        response = requests.get(f"{BACKEND_URL}/products")
        success = response.status_code == 200 and "products" in response.json()
        if success:
            results["passed"] += 1
            # Save a product ID for later tests
            if response.json()["products"]:
                results["test_product_id"] = response.json()["products"][0]["id"]
        else:
            results["failed"] += 1
            results["failures"].append("Get All Products")
        print_test_result("Get All Products", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Get All Products")
        print_test_result("Get All Products", False, error=str(e))
    
    # 2.2 Filter Products by Category
    results["total"] += 1
    try:
        response = requests.get(f"{BACKEND_URL}/products?category=smartphones")
        success = response.status_code == 200 and "products" in response.json()
        if success:
            results["passed"] += 1
            # Verify all returned products are in the smartphones category
            all_smartphones = all(p["category"] == "smartphones" for p in response.json()["products"])
            if not all_smartphones:
                success = False
                results["passed"] -= 1
                results["failed"] += 1
                results["failures"].append("Filter Products by Category")
        else:
            results["failed"] += 1
            results["failures"].append("Filter Products by Category")
        print_test_result("Filter Products by Category", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Filter Products by Category")
        print_test_result("Filter Products by Category", False, error=str(e))
    
    # 2.3 Get Single Product
    if results["test_product_id"]:
        results["total"] += 1
        try:
            response = requests.get(f"{BACKEND_URL}/products/{results['test_product_id']}")
            success = response.status_code == 200 and "id" in response.json()
            if success:
                results["passed"] += 1
            else:
                results["failed"] += 1
                results["failures"].append("Get Single Product")
            print_test_result("Get Single Product", success, response)
        except Exception as e:
            results["failed"] += 1
            results["failures"].append("Get Single Product")
            print_test_result("Get Single Product", False, error=str(e))
    
    # Skip the rest of the tests if we don't have an auth token
    if not results["auth_token"]:
        print("\n⚠️ Cannot proceed with authenticated tests without a valid token")
        return results
    
    # Set up auth headers for subsequent requests
    auth_headers = {"Authorization": f"Bearer {results['auth_token']}"}
    
    # 3. Test Shopping Cart System
    print("\n\n🛒 TESTING SHOPPING CART SYSTEM")
    print("=" * 80)
    
    # 3.1 Get Cart (should be empty initially)
    results["total"] += 1
    try:
        response = requests.get(f"{BACKEND_URL}/cart", headers=auth_headers)
        success = response.status_code == 200
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append("Get Cart")
        print_test_result("Get Cart", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Get Cart")
        print_test_result("Get Cart", False, error=str(e))
    
    # 3.2 Add Item to Cart
    if results["test_product_id"]:
        results["total"] += 1
        cart_item = {
            "product_id": results["test_product_id"],
            "quantity": 2,
            "price": 1199.99  # This should match the product price
        }
        try:
            response = requests.post(f"{BACKEND_URL}/cart/add", json=cart_item, headers=auth_headers)
            success = response.status_code == 200 and "cart" in response.json()
            if success:
                results["passed"] += 1
            else:
                results["failed"] += 1
                results["failures"].append("Add Item to Cart")
            print_test_result("Add Item to Cart", success, response)
        except Exception as e:
            results["failed"] += 1
            results["failures"].append("Add Item to Cart")
            print_test_result("Add Item to Cart", False, error=str(e))
        
        # 3.3 Remove Item from Cart
        results["total"] += 1
        try:
            # Let's print the URL we're trying to access for debugging
            remove_url = f"{BACKEND_URL}/cart/remove/{results['test_product_id']}"
            print(f"DEBUG: Attempting to remove item with URL: {remove_url}")
            
            response = requests.delete(remove_url, headers=auth_headers)
            success = response.status_code == 200 and "cart" in response.json()
            if success:
                results["passed"] += 1
            else:
                results["failed"] += 1
                results["failures"].append("Remove Item from Cart")
            print_test_result("Remove Item from Cart", success, response)
        except Exception as e:
            results["failed"] += 1
            results["failures"].append("Remove Item from Cart")
            print_test_result("Remove Item from Cart", False, error=str(e))
    
    # 4. Test Order Management
    print("\n\n📦 TESTING ORDER MANAGEMENT")
    print("=" * 80)
    
    # 4.1 Add item to cart again for order creation
    if results["test_product_id"]:
        cart_item = {
            "product_id": results["test_product_id"],
            "quantity": 1,
            "price": 1199.99
        }
        try:
            response = requests.post(f"{BACKEND_URL}/cart/add", json=cart_item, headers=auth_headers)
            # We don't count this as a test, just preparation
        except Exception as e:
            print(f"Error preparing cart for order test: {str(e)}")
    
        # 4.2 Create Order
        results["total"] += 1
        order_data = {
            "items": [cart_item],
            "total_amount": 1199.99,
            "payment_method": "credit_card",
            "shipping_address": {
                "street": "123 Test Street",
                "city": "Test City",
                "state": "Test State",
                "zip": "12345",
                "country": "Test Country"
            }
        }
        try:
            response = requests.post(f"{BACKEND_URL}/orders", json=order_data, headers=auth_headers)
            success = response.status_code == 200 and "order_id" in response.json()
            if success:
                results["passed"] += 1
            else:
                results["failed"] += 1
                results["failures"].append("Create Order")
            print_test_result("Create Order", success, response)
        except Exception as e:
            results["failed"] += 1
            results["failures"].append("Create Order")
            print_test_result("Create Order", False, error=str(e))
    
    # 4.3 Get Orders
    results["total"] += 1
    try:
        response = requests.get(f"{BACKEND_URL}/orders", headers=auth_headers)
        success = response.status_code == 200 and "orders" in response.json()
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append("Get Orders")
        print_test_result("Get Orders", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Get Orders")
        print_test_result("Get Orders", False, error=str(e))
    
    # 5. Test Review System
    print("\n\n⭐ TESTING REVIEW SYSTEM")
    print("=" * 80)
    
    # 5.1 Create Review
    if results["test_product_id"]:
        results["total"] += 1
        review_data = {
            "product_id": results["test_product_id"],
            "rating": 5,
            "comment": "Excellent product, highly recommended!",
            "verified_purchase": True
        }
        try:
            response = requests.post(f"{BACKEND_URL}/reviews", json=review_data, headers=auth_headers)
            success = response.status_code == 200
            if success:
                results["passed"] += 1
            else:
                results["failed"] += 1
                results["failures"].append("Create Review")
            print_test_result("Create Review", success, response)
        except Exception as e:
            results["failed"] += 1
            results["failures"].append("Create Review")
            print_test_result("Create Review", False, error=str(e))
    
    # 5.2 Verify Product Rating Update
    if results["test_product_id"]:
        results["total"] += 1
        try:
            response = requests.get(f"{BACKEND_URL}/products/{results['test_product_id']}")
            success = response.status_code == 200 and "rating" in response.json()
            if success:
                results["passed"] += 1
            else:
                results["failed"] += 1
                results["failures"].append("Verify Product Rating Update")
            print_test_result("Verify Product Rating Update", success, response)
        except Exception as e:
            results["failed"] += 1
            results["failures"].append("Verify Product Rating Update")
            print_test_result("Verify Product Rating Update", False, error=str(e))
    
    # Print summary
    print("\n\n📊 TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {results['total']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    
    if results["failures"]:
        print("\nFailed Tests:")
        for failure in results["failures"]:
            print(f"- {failure}")
    
    return results

if __name__ == "__main__":
    print("\n🚀 Starting Ikeja.com Backend API Tests")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    results = run_test_suite()
    
    # Exit with appropriate status code
    exit(0 if results["failed"] == 0 else 1)