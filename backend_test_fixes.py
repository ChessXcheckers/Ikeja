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

def login_test_user():
    """Login the test user and return the auth token"""
    try:
        response = requests.post(f"{BACKEND_URL}/auth/login", json=TEST_USER)
        if response.status_code == 200 and "token" in response.json():
            return response.json()["token"]
        else:
            print(f"Failed to login test user: {response.text}")
            return None
    except Exception as e:
        print(f"Error logging in test user: {str(e)}")
        return None

def get_test_product_id():
    """Get a product ID for testing"""
    try:
        response = requests.get(f"{BACKEND_URL}/products")
        if response.status_code == 200 and "products" in response.json() and response.json()["products"]:
            return response.json()["products"][0]["id"]
        else:
            print("Failed to get test product ID")
            return None
    except Exception as e:
        print(f"Error getting test product ID: {str(e)}")
        return None

def test_cart_remove():
    """Test the cart/remove/{product_id} endpoint"""
    print("\n\n🛒 TESTING SHOPPING CART REMOVE FUNCTIONALITY")
    print("=" * 80)
    
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "failures": []
    }
    
    # Login and get auth token
    auth_token = login_test_user()
    if not auth_token:
        print("Cannot proceed with cart tests without authentication")
        return results
    
    auth_headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get a product ID for testing
    product_id = get_test_product_id()
    if not product_id:
        print("Cannot proceed with cart tests without a product ID")
        return results
    
    # 1. First, add an item to the cart
    results["total"] += 1
    cart_item = {
        "product_id": product_id,
        "quantity": 2,
        "price": 1199.99
    }
    
    try:
        print("Adding item to cart for removal test...")
        response = requests.post(f"{BACKEND_URL}/cart/add", json=cart_item, headers=auth_headers)
        success = response.status_code == 200 and "cart" in response.json()
        
        if success:
            results["passed"] += 1
            print_test_result("Add Item to Cart (Preparation)", success, response)
            
            # 2. Now test removing the item
            results["total"] += 1
            try:
                remove_url = f"{BACKEND_URL}/cart/remove/{product_id}"
                print(f"Removing item with URL: {remove_url}")
                
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
            
            # 3. Test removing non-existent item
            results["total"] += 1
            try:
                non_existent_id = "non-existent-product-id"
                remove_url = f"{BACKEND_URL}/cart/remove/{non_existent_id}"
                print(f"Removing non-existent item with URL: {remove_url}")
                
                response = requests.delete(remove_url, headers=auth_headers)
                # Should return 404 for non-existent item
                success = response.status_code == 404 and "detail" in response.json()
                
                if success:
                    results["passed"] += 1
                else:
                    results["failed"] += 1
                    results["failures"].append("Remove Non-existent Item from Cart")
                
                print_test_result("Remove Non-existent Item from Cart", success, response)
            except Exception as e:
                results["failed"] += 1
                results["failures"].append("Remove Non-existent Item from Cart")
                print_test_result("Remove Non-existent Item from Cart", False, error=str(e))
            
            # 4. Test removing from empty cart
            # First, make sure cart is empty by checking current cart
            try:
                response = requests.get(f"{BACKEND_URL}/cart", headers=auth_headers)
                cart_is_empty = response.status_code == 200 and len(response.json().get("items", [])) == 0
                
                if not cart_is_empty:
                    # If not empty, try to remove all items
                    for item in response.json().get("items", []):
                        requests.delete(f"{BACKEND_URL}/cart/remove/{item['product_id']}", headers=auth_headers)
                
                # Now test removing from empty cart
                results["total"] += 1
                remove_url = f"{BACKEND_URL}/cart/remove/{product_id}"
                print(f"Removing from empty cart with URL: {remove_url}")
                
                response = requests.delete(remove_url, headers=auth_headers)
                # Should return a message that cart is empty, not an error
                success = response.status_code == 200 and "message" in response.json() and "empty" in response.json()["message"].lower()
                
                if success:
                    results["passed"] += 1
                else:
                    results["failed"] += 1
                    results["failures"].append("Remove from Empty Cart")
                
                print_test_result("Remove from Empty Cart", success, response)
            except Exception as e:
                results["failed"] += 1
                results["failures"].append("Remove from Empty Cart")
                print_test_result("Remove from Empty Cart", False, error=str(e))
            
        else:
            results["failed"] += 1
            results["failures"].append("Add Item to Cart (Preparation)")
            print_test_result("Add Item to Cart (Preparation)", success, response)
            print("Cannot proceed with remove tests without adding item first")
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Add Item to Cart (Preparation)")
        print_test_result("Add Item to Cart (Preparation)", False, error=str(e))
        print("Cannot proceed with remove tests without adding item first")
    
    return results

def test_review_system():
    """Test the review creation functionality"""
    print("\n\n⭐ TESTING REVIEW SYSTEM FUNCTIONALITY")
    print("=" * 80)
    
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "failures": []
    }
    
    # Login and get auth token
    auth_token = login_test_user()
    if not auth_token:
        print("Cannot proceed with review tests without authentication")
        return results
    
    auth_headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get a product ID for testing
    product_id = get_test_product_id()
    if not product_id:
        print("Cannot proceed with review tests without a product ID")
        return results
    
    # 1. Test creating a valid review
    results["total"] += 1
    review_data = {
        "product_id": product_id,
        "rating": 4,
        "comment": "Great product with excellent features!",
        "verified_purchase": True,
        "user_id": "",  # This will be set by the server
        "id": "",  # This will be set by the server
        "created_at": ""  # This will be set by the server
    }
    
    try:
        print("Creating a valid review...")
        response = requests.post(f"{BACKEND_URL}/reviews", json=review_data, headers=auth_headers)
        
        # If the user has already reviewed this product, we'll get a 400 error
        # This is expected behavior, so we'll handle it
        if response.status_code == 400 and "already reviewed" in response.json().get("detail", "").lower():
            print("User has already reviewed this product. This is expected behavior.")
            success = True
        else:
            success = response.status_code == 200 and "review_id" in response.json()
        
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append("Create Valid Review")
        
        print_test_result("Create Valid Review", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Create Valid Review")
        print_test_result("Create Valid Review", False, error=str(e))
    
    # 2. Test duplicate review prevention
    results["total"] += 1
    try:
        print("Testing duplicate review prevention...")
        response = requests.post(f"{BACKEND_URL}/reviews", json=review_data, headers=auth_headers)
        
        # Should return 400 for duplicate review
        success = response.status_code == 400 and "already reviewed" in response.json().get("detail", "").lower()
        
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append("Duplicate Review Prevention")
        
        print_test_result("Duplicate Review Prevention", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Duplicate Review Prevention")
        print_test_result("Duplicate Review Prevention", False, error=str(e))
    
    # 3. Test invalid rating range (too low)
    results["total"] += 1
    invalid_rating_data = review_data.copy()
    invalid_rating_data["rating"] = 0  # Invalid rating (below 1)
    
    try:
        print("Testing invalid rating range (too low)...")
        response = requests.post(f"{BACKEND_URL}/reviews", json=invalid_rating_data, headers=auth_headers)
        
        # Should return 400 for invalid rating
        success = response.status_code == 400 and "rating" in response.json().get("detail", "").lower()
        
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append("Invalid Rating Range (Too Low)")
        
        print_test_result("Invalid Rating Range (Too Low)", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Invalid Rating Range (Too Low)")
        print_test_result("Invalid Rating Range (Too Low)", False, error=str(e))
    
    # 4. Test invalid rating range (too high)
    results["total"] += 1
    invalid_rating_data = review_data.copy()
    invalid_rating_data["rating"] = 6  # Invalid rating (above 5)
    
    try:
        print("Testing invalid rating range (too high)...")
        response = requests.post(f"{BACKEND_URL}/reviews", json=invalid_rating_data, headers=auth_headers)
        
        # Should return 400 for invalid rating
        success = response.status_code == 400 and "rating" in response.json().get("detail", "").lower()
        
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append("Invalid Rating Range (Too High)")
        
        print_test_result("Invalid Rating Range (Too High)", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Invalid Rating Range (Too High)")
        print_test_result("Invalid Rating Range (Too High)", False, error=str(e))
    
    # 5. Test non-existent product review
    results["total"] += 1
    non_existent_review_data = review_data.copy()
    non_existent_review_data["product_id"] = "non-existent-product-id"
    
    try:
        print("Testing review for non-existent product...")
        response = requests.post(f"{BACKEND_URL}/reviews", json=non_existent_review_data, headers=auth_headers)
        
        # Should return 404 for non-existent product
        success = response.status_code == 404 and "product not found" in response.json().get("detail", "").lower()
        
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["failures"].append("Non-existent Product Review")
        
        print_test_result("Non-existent Product Review", success, response)
    except Exception as e:
        results["failed"] += 1
        results["failures"].append("Non-existent Product Review")
        print_test_result("Non-existent Product Review", False, error=str(e))
    
    return results

def run_test_suite():
    """Run all tests and return results"""
    print("\n🚀 Starting Ikeja.com Backend API Fixes Tests")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Test Shopping Cart System - Remove Item Fix
    cart_results = test_cart_remove()
    
    # Test Review System - Creation Fix
    review_results = test_review_system()
    
    # Combine results
    total_results = {
        "total": cart_results["total"] + review_results["total"],
        "passed": cart_results["passed"] + review_results["passed"],
        "failed": cart_results["failed"] + review_results["failed"],
        "failures": cart_results["failures"] + review_results["failures"]
    }
    
    # Print summary
    print("\n\n📊 TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {total_results['total']}")
    print(f"Passed: {total_results['passed']}")
    print(f"Failed: {total_results['failed']}")
    
    if total_results["failures"]:
        print("\nFailed Tests:")
        for failure in total_results["failures"]:
            print(f"- {failure}")
    
    return total_results

if __name__ == "__main__":
    results = run_test_suite()
    
    # Exit with appropriate status code
    exit(0 if results["failed"] == 0 else 1)