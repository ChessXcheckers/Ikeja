from typing import List, Dict, Any, Optional
from ..models.tracking import UserBehavior, ProductInteraction, RecommendationScore, UserRecommendations
from ..models.product import Product
from datetime import datetime, timedelta
import logging
import math
from collections import defaultdict, Counter

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self, db):
        self.db = db
        self.products_collection = db.products
        self.interactions_collection = db.product_interactions
        self.behaviors_collection = db.user_behaviors
        self.recommendations_collection = db.user_recommendations
        
    async def generate_recommendations(self, user_id: Optional[str] = None, 
                                     session_id: Optional[str] = None,
                                     limit: int = 10) -> List[RecommendationScore]:
        """Generate product recommendations for user or session"""
        
        recommendations = []
        
        if user_id:
            # Get user-based recommendations
            user_recs = await self._get_user_based_recommendations(user_id, limit // 2)
            recommendations.extend(user_recs)
            
            # Get collaborative filtering recommendations
            collab_recs = await self._get_collaborative_recommendations(user_id, limit // 2)
            recommendations.extend(collab_recs)
        
        if session_id:
            # Get session-based recommendations
            session_recs = await self._get_session_based_recommendations(session_id, limit)
            recommendations.extend(session_recs)
        
        # If no specific recommendations, get trending products
        if not recommendations:
            recommendations = await self._get_trending_recommendations(limit)
        
        # Remove duplicates and sort by score
        seen_products = set()
        unique_recommendations = []
        
        for rec in sorted(recommendations, key=lambda x: x.score, reverse=True):
            if rec.product_id not in seen_products:
                unique_recommendations.append(rec)
                seen_products.add(rec.product_id)
        
        return unique_recommendations[:limit]
    
    async def _get_user_based_recommendations(self, user_id: str, limit: int) -> List[RecommendationScore]:
        """Get recommendations based on user's behavior and preferences"""
        
        # Get user behavior
        user_behavior = await self.behaviors_collection.find_one({"user_id": user_id})
        if not user_behavior:
            return []
        
        recommendations = []
        
        # Get products from favorite categories
        if user_behavior.get("favorite_categories"):
            category_products = await self.products_collection.find({
                "category": {"$in": user_behavior["favorite_categories"]},
                "status": "active"
            }).limit(limit * 2).to_list(limit * 2)
            
            for product in category_products:
                score = self._calculate_category_score(product, user_behavior)
                recommendations.append(RecommendationScore(
                    product_id=str(product["_id"]),
                    score=score,
                    reasons=[f"Matches your interest in {product['category']}"],
                    confidence=0.7
                ))
        
        return recommendations[:limit]
    
    async def _get_collaborative_recommendations(self, user_id: str, limit: int) -> List[RecommendationScore]:
        """Get recommendations based on similar users' behavior"""
        
        # Find users with similar interactions
        user_interactions = await self.interactions_collection.find({
            "user_id": user_id
        }).to_list(1000)
        
        if not user_interactions:
            return []
        
        user_products = set(interaction["product_id"] for interaction in user_interactions)
        
        # Find similar users
        similar_users = await self._find_similar_users(user_id, user_products)
        
        recommendations = []
        product_scores = defaultdict(float)
        
        for similar_user_id, similarity_score in similar_users[:10]:
            similar_interactions = await self.interactions_collection.find({
                "user_id": similar_user_id,
                "product_id": {"$nin": list(user_products)}
            }).to_list(100)
            
            for interaction in similar_interactions:
                product_id = interaction["product_id"]
                interaction_weight = self._get_interaction_weight(interaction["interaction_type"])
                product_scores[product_id] += similarity_score * interaction_weight
        
        # Convert to recommendations
        for product_id, score in sorted(product_scores.items(), key=lambda x: x[1], reverse=True)[:limit]:
            recommendations.append(RecommendationScore(
                product_id=product_id,
                score=min(score, 1.0),
                reasons=["Users with similar interests also liked this"],
                confidence=0.6
            ))
        
        return recommendations
    
    async def _get_session_based_recommendations(self, session_id: str, limit: int) -> List[RecommendationScore]:
        """Get recommendations based on current session activity"""
        
        # Get recent session interactions
        session_interactions = await self.interactions_collection.find({
            "session_id": session_id,
            "timestamp": {"$gte": datetime.utcnow() - timedelta(hours=24)}
        }).sort("timestamp", -1).to_list(50)
        
        if not session_interactions:
            return []
        
        recommendations = []
        
        # Get categories from session
        session_categories = []
        for interaction in session_interactions:
            product = await self.products_collection.find_one({"_id": interaction["product_id"]})
            if product:
                session_categories.append(product["category"])
        
        # Find products in similar categories
        if session_categories:
            most_common_category = Counter(session_categories).most_common(1)[0][0]
            
            similar_products = await self.products_collection.find({
                "category": most_common_category,
                "status": "active",
                "_id": {"$nin": [i["product_id"] for i in session_interactions]}
            }).limit(limit).to_list(limit)
            
            for product in similar_products:
                recommendations.append(RecommendationScore(
                    product_id=str(product["_id"]),
                    score=0.8,
                    reasons=[f"Based on your current browsing in {most_common_category}"],
                    confidence=0.8
                ))
        
        return recommendations
    
    async def _get_trending_recommendations(self, limit: int) -> List[RecommendationScore]:
        """Get trending products as fallback recommendations"""
        
        # Get products with high view counts
        trending_products = await self.products_collection.find({
            "status": "active"
        }).sort("view_count", -1).limit(limit).to_list(limit)
        
        recommendations = []
        for product in trending_products:
            recommendations.append(RecommendationScore(
                product_id=str(product["_id"]),
                score=0.5,
                reasons=["Trending product"],
                confidence=0.4
            ))
        
        return recommendations
    
    async def _find_similar_users(self, user_id: str, user_products: set) -> List[tuple]:
        """Find users with similar product interests"""
        
        similar_users = []
        
        # Get other users who interacted with same products
        pipeline = [
            {"$match": {"product_id": {"$in": list(user_products)}, "user_id": {"$ne": user_id}}},
            {"$group": {"_id": "$user_id", "common_products": {"$addToSet": "$product_id"}}},
            {"$project": {"user_id": "$_id", "common_count": {"$size": "$common_products"}}},
            {"$sort": {"common_count": -1}},
            {"$limit": 50}
        ]
        
        cursor = self.interactions_collection.aggregate(pipeline)
        async for doc in cursor:
            similarity_score = min(doc["common_count"] / len(user_products), 1.0)
            similar_users.append((doc["user_id"], similarity_score))
        
        return similar_users
    
    def _calculate_category_score(self, product: Dict[str, Any], user_behavior: Dict[str, Any]) -> float:
        """Calculate recommendation score based on category preference"""
        
        base_score = 0.5
        
        # Boost score if product is in favorite categories
        if product["category"] in user_behavior.get("favorite_categories", []):
            base_score += 0.3
        
        # Consider product popularity
        view_count = product.get("view_count", 0)
        popularity_score = min(view_count / 1000, 0.2)  # Max 0.2 boost
        
        return min(base_score + popularity_score, 1.0)
    
    def _get_interaction_weight(self, interaction_type: str) -> float:
        """Get weight for different interaction types"""
        weights = {
            "view": 0.1,
            "like": 0.3,
            "cart_add": 0.6,
            "purchase": 1.0
        }
        return weights.get(interaction_type, 0.1)
    
    async def save_recommendations(self, user_id: Optional[str], session_id: Optional[str], 
                                 recommendations: List[RecommendationScore]):
        """Save generated recommendations"""
        
        rec_data = UserRecommendations(
            user_id=user_id or "",
            session_id=session_id,
            recommendations=recommendations
        )
        
        await self.recommendations_collection.insert_one(rec_data.dict())
    
    async def track_interaction(self, product_id: str, user_id: Optional[str], 
                              session_id: str, interaction_type: str, duration: Optional[float] = None):
        """Track user interaction with product"""
        
        interaction = ProductInteraction(
            product_id=product_id,
            user_id=user_id,
            session_id=session_id,
            interaction_type=interaction_type,
            duration=duration
        )
        
        await self.interactions_collection.insert_one(interaction.dict())
        
        # Update product view count
        if interaction_type == "view":
            await self.products_collection.update_one(
                {"_id": product_id},
                {"$inc": {"view_count": 1}, "$set": {"last_viewed": datetime.utcnow()}}
            )
    
    async def update_user_behavior(self, user_id: str):
        """Update user behavior analytics"""
        
        # Get user interactions
        interactions = await self.interactions_collection.find({
            "user_id": user_id
        }).to_list(1000)
        
        if not interactions:
            return
        
        # Calculate behavior metrics
        total_views = sum(1 for i in interactions if i["interaction_type"] == "view")
        total_searches = sum(1 for i in interactions if i["interaction_type"] == "search")
        
        # Get favorite categories
        product_categories = []
        for interaction in interactions:
            product = await self.products_collection.find_one({"_id": interaction["product_id"]})
            if product:
                product_categories.append(product["category"])
        
        favorite_categories = [cat for cat, count in Counter(product_categories).most_common(5)]
        
        # Calculate behavior score
        behavior_score = self._calculate_behavior_score(interactions)
        
        # Update or create user behavior
        behavior_data = {
            "user_id": user_id,
            "total_page_views": total_views,
            "total_product_views": total_views,
            "total_searches": total_searches,
            "favorite_categories": favorite_categories,
            "last_seen": datetime.utcnow(),
            "behavior_score": behavior_score
        }
        
        await self.behaviors_collection.update_one(
            {"user_id": user_id},
            {"$set": behavior_data},
            upsert=True
        )
    
    def _calculate_behavior_score(self, interactions: List[Dict[str, Any]]) -> float:
        """Calculate user engagement behavior score"""
        
        if not interactions:
            return 0.0
        
        score = 0.0
        weights = {
            "view": 1,
            "like": 2,
            "cart_add": 5,
            "purchase": 10
        }
        
        for interaction in interactions:
            interaction_type = interaction.get("interaction_type", "view")
            score += weights.get(interaction_type, 1)
        
        # Normalize score (0-1 range)
        max_possible_score = len(interactions) * 10
        return min(score / max_possible_score, 1.0) if max_possible_score > 0 else 0.0