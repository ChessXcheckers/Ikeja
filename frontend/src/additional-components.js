import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useApp, LoadingSpinner, Toast } from './components';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Enhanced Categories Section with Real Data
export const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { trackEvent } = useApp();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get(`${API}/categories`);
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryClick = async (category) => {
    await trackEvent('category_view', { category: category.name });
  };

  const categoryImages = {
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    'apparel': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
    'machinery': 'https://images.unsplash.com/photo-1717386255773-1e3037c81788?w=400',
    'home_garden': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    'beauty': 'https://images.unsplash.com/photo-1676570092589-a6c09ecbb373?w=400',
    'logistics': 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400'
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Shop by Category</h2>
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12"
        >
          Shop by Category
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {categories.map((category, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group cursor-pointer"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300">
                <motion.img 
                  src={categoryImages[category.name] || 'https://via.placeholder.com/400x300'}
                  alt={category.name}
                  className="w-full h-48 md:h-64 object-cover"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all duration-300">
                  <div className="absolute bottom-4 left-4 text-white">
                    <motion.h3 
                      initial={{ x: -20 }}
                      whileInView={{ x: 0 }}
                      className="text-lg md:text-xl font-semibold mb-2 capitalize"
                    >
                      {category.name.replace('_', ' & ')}
                    </motion.h3>
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-sm text-gray-200 mb-2"
                    >
                      {category.count} products
                    </motion.div>
                    <div className="space-y-1">
                      {category.subcategories.slice(0, 2).map((sub, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ x: -20, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + idx * 0.05 }}
                          className="text-xs md:text-sm text-gray-200"
                        >
                          {sub}
                        </motion.div>
                      ))}
                      {category.subcategories.length > 2 && (
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-xs md:text-sm text-orange-300"
                        >
                          +{category.subcategories.length - 2} more
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
                <motion.div 
                  className="absolute top-4 right-4 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {category.count}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Enhanced Featured Products with Real Data
export const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const { trackEvent, user, loadCart } = useApp();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await axios.get(`${API}/products?limit=8`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleProductClick = async (product) => {
    await trackEvent('product_view', { 
      product_id: product.id,
      product_name: product.name,
      category: product.category
    });
  };

  const handleAddToCart = async (event, productId, quantity = 1) => {
    event.stopPropagation();
    
    if (!user) {
      showToast('Please sign in to add items to cart', 'error');
      return;
    }

    try {
      await axios.post(`${API}/cart/${user.id}/items`, null, {
        params: { product_id: productId, quantity }
      });
      
      await loadCart(user.id);
      await trackEvent('cart_add', { product_id: productId, quantity });
      showToast('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Error adding item to cart', 'error');
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Products</h2>
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-bold text-gray-900"
          >
            Featured Products
          </motion.h2>
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            whileHover={{ x: 5 }}
            className="text-orange-500 hover:text-orange-600 font-medium text-sm md:text-base hidden sm:block"
          >
            View all products →
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="border rounded-lg overflow-hidden hover:shadow-xl transition-all group cursor-pointer bg-white"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative overflow-hidden">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/300x200'}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {product.supplier.trade_assurance && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded shadow-lg"
                  >
                    Trade Assurance
                  </motion.div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm md:text-base">
                  {product.name}
                </h3>
                <div className="text-lg font-bold text-orange-600 mb-1">
                  ${product.pricing.min_price} - ${product.pricing.max_price}
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  Min. order: {product.min_order_quantity} pieces
                </div>
                
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="text-gray-600 truncate flex-1 mr-2">
                    {product.supplier.name}
                  </div>
                  {product.supplier.verification_status && (
                    <div className="flex items-center text-blue-600 shrink-0">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Verified</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < Math.floor(product.supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                    <span className="text-xs text-gray-500 ml-1">({product.supplier.rating})</span>
                  </div>
                  <span className="text-xs text-gray-500">{product.view_count} views</span>
                </div>

                <motion.button
                  onClick={(e) => handleAddToCart(e, product.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors text-sm font-medium mt-3"
                >
                  Add to Cart
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View More Button for Mobile */}
        <div className="text-center mt-8 sm:hidden">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            View All Products
          </motion.button>
        </div>
      </div>
    </section>
  );
};

// Recommendations Section
export const RecommendationsSection = () => {
  const { recommendations, user, sessionId, loadRecommendations } = useApp();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user || sessionId) {
      setLoading(true);
      loadRecommendations().finally(() => setLoading(false));
    }
  }, [user, sessionId]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadRecommendations();
    setLoading(false);
  };

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-bold text-gray-900"
          >
            {user ? '🎯 Recommended for You' : '💡 You Might Also Like'}
          </motion.h2>
          <motion.button 
            onClick={handleRefresh}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-orange-500 hover:text-orange-600 font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : <span>🔄</span>}
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.slice(0, 4).map((rec, index) => (
            <motion.div 
              key={rec.product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="border rounded-lg overflow-hidden hover:shadow-xl transition-all bg-white group cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <img 
                  src={rec.product.images?.[0]?.url || 'https://via.placeholder.com/300x200'}
                  alt={rec.product.name}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                  {Math.round(rec.score * 100)}% match
                </div>
                <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                  AI Pick
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {rec.product.name}
                </h3>
                <div className="text-lg font-bold text-orange-600 mb-2">
                  ${rec.product.pricing.min_price} - ${rec.product.pricing.max_price}
                </div>
                <div className="text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded italic">
                  💭 {rec.reasons.join(', ')}
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600 truncate flex-1 mr-2">
                    {rec.product.supplier.name}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {Math.round(rec.confidence * 100)}% confident
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 rounded hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-md"
                >
                  View Product
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Payment Modal Component
export const PaymentModal = ({ isOpen, onClose, amount, currency = "USD" }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cryptoMethod, setCryptoMethod] = useState('bitcoin');
  const [loading, setLoading] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const { user } = useApp();

  const handlePayment = async () => {
    if (!user) {
      alert('Please sign in to make a payment');
      return;
    }

    setLoading(true);
    
    try {
      const paymentRequest = {
        amount,
        currency,
        customer: {
          email: user.email,
          name: user.full_name,
          phone: user.phone || "+1234567890"
        },
        payment_method: paymentMethod,
        description: "Product purchase from Alibaba Clone",
        metadata: { user_id: user.id }
      };

      if (paymentMethod === 'crypto') {
        paymentRequest.crypto_payment = {
          crypto_method: cryptoMethod,
          network: "testnet"
        };
      }

      const response = await axios.post(`${API}/payments/initialize`, paymentRequest);
      setPaymentResponse(response.data);

      if (response.data.payment_link) {
        window.open(response.data.payment_link, '_blank');
      }

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-backdrop"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">💳 Payment Options</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-center bg-gray-50 p-4 rounded-lg"
          >
            <div className="text-2xl font-bold text-gray-800 mb-1">
              ${amount} {currency}
            </div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </motion.div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3">Choose Payment Method</label>
              <div className="space-y-3">
                <motion.label 
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">💳</span>
                    <span>Credit/Debit Card (Flutterwave)</span>
                  </div>
                </motion.label>
                <motion.label 
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">🏦</span>
                    <span>Bank Transfer</span>
                  </div>
                </motion.label>
                <motion.label 
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="crypto"
                    checked={paymentMethod === 'crypto'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">₿</span>
                    <div>
                      <div>Cryptocurrency (Trustless)</div>
                      <div className="text-xs text-green-600">🔒 Secure & Decentralized</div>
                    </div>
                  </div>
                </motion.label>
              </div>
            </div>

            <AnimatePresence>
              {paymentMethod === 'crypto' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium mb-2">Select Cryptocurrency</label>
                  <select
                    value={cryptoMethod}
                    onChange={(e) => setCryptoMethod(e.target.value)}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="bitcoin">₿ Bitcoin (BTC)</option>
                    <option value="ethereum">⧫ Ethereum (ETH)</option>
                    <option value="usdt">₮ Tether (USDT)</option>
                    <option value="usdc">🪙 USD Coin (USDC)</option>
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {paymentResponse && paymentResponse.crypto_address && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 p-4 rounded-lg border"
                >
                  <h3 className="font-semibold mb-2 flex items-center">
                    <span className="text-xl mr-2">🔗</span>
                    Send Payment To:
                  </h3>
                  <div className="crypto-address text-xs mb-3">
                    {paymentResponse.crypto_address}
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <div>Amount: {paymentResponse.provider_response.crypto_amount} {cryptoMethod.toUpperCase()}</div>
                    <div>Network: {paymentResponse.provider_response.network}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handlePayment}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-md hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>💰</span>
                  <span>Pay ${amount} {currency}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Footer Component (Enhanced)
export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="https://s.alicdn.com/@img/imgextra/i2/O1CN01BZJqlo1h4aYHpvdYl_!!6000000004223-2-tps-196-50.png" 
              alt="Alibaba.com"
              className="h-8 mb-4 filter brightness-0 invert"
            />
            <p className="text-gray-400 text-sm mb-4">
              The leading B2B ecommerce platform for global trade with advanced payment solutions and AI-powered recommendations.
            </p>
            <div className="flex space-x-4">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </motion.button>
            </div>
          </motion.div>
          
          {/* Customer Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Payment Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Crypto Payments</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Assistant</a></li>
            </ul>
          </motion.div>
          
          {/* Trade Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold mb-4">Trade Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Trade Assurance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Verified Suppliers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Logistics Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Quality Control</a></li>
            </ul>
          </motion.div>
          
          {/* Technology */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-semibold mb-4">Technology</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">AI Recommendations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blockchain Payments</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Integration</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
            </ul>
          </motion.div>
        </div>
        
        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"
        >
          <div className="mb-4 md:mb-0 text-center md:text-left">
            © 2025 Alibaba Clone. All rights reserved. | 🚀 Powered by AI & Blockchain Technology
          </div>
          <div className="flex flex-wrap justify-center md:justify-end space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};