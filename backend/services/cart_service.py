from typing import List, Optional, Dict, Any
from models.cart import Cart, CartItem, CartSummary, CartCreate, CartUpdate
from models.product import Product
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class CartService:
    def __init__(self, db):
        self.db = db
        self.collection = db.carts
        
    async def create_cart(self, user_id: str) -> Cart:
        """Create a new cart for user"""
        cart_data = {
            "user_id": user_id,
            "items": [],
            "summary": CartSummary(
                subtotal=0.0,
                tax=0.0,
                shipping=0.0,
                total=0.0,
                item_count=0
            ).dict(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_persistent": True,
            "expires_at": datetime.utcnow() + timedelta(days=30)
        }
        
        result = await self.collection.insert_one(cart_data)
        cart_data["id"] = str(result.inserted_id)
        
        return Cart(**cart_data)
    
    async def get_cart(self, user_id: str) -> Optional[Cart]:
        """Get user's active cart"""
        cart_data = await self.collection.find_one({"user_id": user_id})
        
        if cart_data:
            cart_data["id"] = str(cart_data["_id"])
            return Cart(**cart_data)
        
        return None
    
    async def get_or_create_cart(self, user_id: str) -> Cart:
        """Get existing cart or create new one"""
        cart = await self.get_cart(user_id)
        
        if not cart:
            cart = await self.create_cart(user_id)
        
        return cart
    
    async def add_item(self, user_id: str, product_id: str, quantity: int, 
                      product_data: Dict[str, Any]) -> Cart:
        """Add item to cart"""
        cart = await self.get_or_create_cart(user_id)
        
        # Check if item already exists in cart
        existing_item = None
        for item in cart.items:
            if item.product_id == product_id:
                existing_item = item
                break
        
        if existing_item:
            # Update quantity of existing item
            existing_item.quantity += quantity
            existing_item.total_price = existing_item.quantity * existing_item.unit_price
        else:
            # Add new item
            cart_item = CartItem(
                product_id=product_id,
                product_name=product_data["name"],
                product_image=product_data["images"][0]["url"] if product_data.get("images") else "",
                quantity=quantity,
                unit_price=product_data["pricing"]["min_price"],
                total_price=quantity * product_data["pricing"]["min_price"],
                currency=product_data["pricing"]["currency"],
                supplier_id=product_data["supplier"]["id"],
                supplier_name=product_data["supplier"]["name"],
                variants=product_data.get("variants", {})
            )
            cart.items.append(cart_item)
        
        # Update cart summary
        cart.summary = self._calculate_summary(cart.items)
        cart.updated_at = datetime.utcnow()
        
        # Save to database
        await self._update_cart_in_db(cart)
        
        return cart
    
    async def remove_item(self, user_id: str, product_id: str) -> Cart:
        """Remove item from cart"""
        cart = await self.get_cart(user_id)
        
        if not cart:
            raise ValueError("Cart not found")
        
        # Remove item
        cart.items = [item for item in cart.items if item.product_id != product_id]
        
        # Update summary
        cart.summary = self._calculate_summary(cart.items)
        cart.updated_at = datetime.utcnow()
        
        # Save to database
        await self._update_cart_in_db(cart)
        
        return cart
    
    async def update_item_quantity(self, user_id: str, product_id: str, quantity: int) -> Cart:
        """Update item quantity in cart"""
        cart = await self.get_cart(user_id)
        
        if not cart:
            raise ValueError("Cart not found")
        
        # Find and update item
        for item in cart.items:
            if item.product_id == product_id:
                if quantity <= 0:
                    # Remove item if quantity is 0 or negative
                    cart.items = [i for i in cart.items if i.product_id != product_id]
                else:
                    item.quantity = quantity
                    item.total_price = quantity * item.unit_price
                break
        
        # Update summary
        cart.summary = self._calculate_summary(cart.items)
        cart.updated_at = datetime.utcnow()
        
        # Save to database
        await self._update_cart_in_db(cart)
        
        return cart
    
    async def clear_cart(self, user_id: str) -> Cart:
        """Clear all items from cart"""
        cart = await self.get_cart(user_id)
        
        if not cart:
            raise ValueError("Cart not found")
        
        cart.items = []
        cart.summary = self._calculate_summary([])
        cart.updated_at = datetime.utcnow()
        
        # Save to database
        await self._update_cart_in_db(cart)
        
        return cart
    
    def _calculate_summary(self, items: List[CartItem]) -> CartSummary:
        """Calculate cart summary"""
        subtotal = sum(item.total_price for item in items)
        tax = subtotal * 0.1  # 10% tax
        shipping = 0.0 if subtotal > 100 else 15.0  # Free shipping over $100
        total = subtotal + tax + shipping
        item_count = sum(item.quantity for item in items)
        
        return CartSummary(
            subtotal=round(subtotal, 2),
            tax=round(tax, 2),
            shipping=round(shipping, 2),
            total=round(total, 2),
            currency="USD",
            item_count=item_count
        )
    
    async def _update_cart_in_db(self, cart: Cart):
        """Update cart in database"""
        cart_dict = cart.dict()
        cart_dict.pop("id", None)
        
        await self.collection.update_one(
            {"user_id": cart.user_id},
            {"$set": cart_dict}
        )
    
    async def cleanup_expired_carts(self):
        """Remove expired carts"""
        result = await self.collection.delete_many({
            "expires_at": {"$lt": datetime.utcnow()},
            "is_persistent": False
        })
        
        logger.info(f"Cleaned up {result.deleted_count} expired carts")