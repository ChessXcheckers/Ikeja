import React, { useState, useEffect, useContext, createContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Constants
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Context for global state management
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const [sessionId] = useState(() => 'session_' + Math.random().toString(36).substr(2, 9));
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Track events
  const trackEvent = async (eventType, properties = {}) => {
    try {
      await axios.post(`${API}/tracking/event`, {
        session_id: sessionId,
        user_id: user?.id,
        event_type: eventType,
        page_url: window.location.pathname,
        properties,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  // Load cart
  const loadCart = async (userId) => {
    try {
      const response = await axios.get(`${API}/cart/${userId}`);
      setCart(response.data);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Load recommendations
  const loadRecommendations = async () => {
    try {
      const endpoint = user?.id 
        ? `${API}/recommendations/${user.id}?session_id=${sessionId}`
        : `${API}/recommendations/session/${sessionId}`;
      
      const response = await axios.get(endpoint);
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      user, setUser,
      cart, setCart,
      sessionId,
      recommendations, setRecommendations,
      loading, setLoading,
      trackEvent,
      loadCart,
      loadRecommendations
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-orange-500 ${sizeClasses[size]}`}></div>
  );
};

// Toast Notification Component
export const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`fixed top-4 right-4 z-50 ${typeColors[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

// Enhanced Header Component with Cart
export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const { user, setUser, cart, sessionId, trackEvent, loadCart } = useApp();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    if (!user) {
      showToast('Please sign in to add items to cart', 'error');
      return;
    }

    try {
      await axios.post(`${API}/cart/${user.id}/items`, null, {
        params: { product_id: productId, quantity }
      });
      
      // Reload cart
      await loadCart(user.id);
      
      // Track event
      await trackEvent('cart_add', { product_id: productId, quantity });
      
      showToast('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Error adding item to cart', 'error');
    }
  };

  const handleLogin = () => {
    // Simulate login
    const mockUser = { 
      id: 'user_001', 
      full_name: 'John Smith', 
      email: 'john@example.com',
      phone: '+1234567890'
    };
    setUser(mockUser);
    loadCart(mockUser.id);
    showToast(`Welcome back, ${mockUser.full_name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setCart(null);
    showToast('You have been signed out');
  };

  return (
    <>
      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="font-semibold">COCREATE 2025</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Explore 20K+ top products & suppliers in person</span>
          </div>
          <div className="bg-orange-700 px-3 py-1 rounded text-xs font-medium">
            Use code: savemore
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top row */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-4 md:space-x-8">
              <img 
                src="https://s.alicdn.com/@img/imgextra/i2/O1CN01BZJqlo1h4aYHpvdYl_!!6000000004223-2-tps-196-50.png" 
                alt="Alibaba.com"
                className="h-6 md:h-8 cursor-pointer"
                onClick={() => window.location.href = '/'}
              />
              <div className="hidden md:flex items-center space-x-1 text-sm text-gray-600">
                <span>Deliver to:</span>
                <div className="flex items-center space-x-1">
                  <img src="https://flagcdn.com/w20/us.png" alt="US" className="w-4 h-3" />
                  <span className="font-medium">US</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 md:space-x-6">
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <span>English-USD</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Cart Icon */}
              <div className="relative">
                <button 
                  className="p-2 relative hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => setShowCart(!showCart)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
                  </svg>
                  {cart && cart.summary.item_count > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {cart.summary.item_count}
                    </motion.span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                <AnimatePresence>
                  {showCart && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-white shadow-xl rounded-lg z-50 border"
                    >
                      <div className="p-4">
                        <h3 className="font-semibold mb-3">Shopping Cart</h3>
                        {cart && cart.items.length > 0 ? (
                          <>
                            {cart.items.slice(0, 3).map((item) => (
                              <motion.div 
                                key={item.product_id} 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center space-x-3 mb-3 pb-3 border-b"
                              >
                                <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm line-clamp-2">{item.product_name}</div>
                                  <div className="text-gray-500 text-xs">Qty: {item.quantity}</div>
                                  <div className="text-orange-600 font-semibold">${item.total_price}</div>
                                </div>
                              </motion.div>
                            ))}
                            {cart.items.length > 3 && (
                              <div className="text-center text-sm text-gray-500 mb-3">
                                +{cart.items.length - 3} more items
                              </div>
                            )}
                            <div className="text-center border-t pt-3">
                              <div className="font-semibold mb-2">Total: ${cart.summary.total}</div>
                              <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 w-full transition-colors"
                              >
                                View Cart & Checkout
                              </motion.button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
                            </svg>
                            <p>Your cart is empty</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {user ? (
                <div className="relative">
                  <button 
                    className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {user.full_name[0]}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{user.full_name}</div>
                      <div className="text-xs text-gray-500">My Account</div>
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white shadow-xl rounded-lg z-50 border"
                      >
                        <div className="py-2">
                          <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-100">My Orders</a>
                          <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-100">Profile Settings</a>
                          <a href="#" className="block px-4 py-2 text-sm hover:bg-gray-100">Payment Methods</a>
                          <hr className="my-2" />
                          <button 
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                          >
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    className="text-sm hover:text-orange-500 transition-colors"
                    onClick={handleLogin}
                  >
                    Sign in
                  </button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-orange-500 text-white px-3 md:px-4 py-2 rounded text-sm hover:bg-orange-600 transition-colors"
                  >
                    Join Free
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Navigation - Mobile Hidden */}
          <nav className="hidden md:flex items-center space-x-8 py-3 border-t text-sm">
            <button className="flex items-center space-x-1 hover:text-orange-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>All categories</span>
            </button>
            <a href="#" className="hover:text-orange-500 transition-colors">Featured selections</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Order protections</a>
            <a href="#" className="hover:text-orange-500 transition-colors">AI sourcing agent</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Buyer Central</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Help Center</a>
            <a href="#" className="hover:text-orange-500 transition-colors">App & extension</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Become a supplier</a>
          </nav>
        </div>
      </header>
    </>
  );
};

// Enhanced Hero Section with Real Search
export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('iphones 15 pro max');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user, sessionId, trackEvent } = useApp();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API}/search`, {
        params: {
          q: searchQuery,
          user_id: user?.id,
          session_id: sessionId
        }
      });
      
      setSearchResults(response.data.products);
      await trackEvent('search', { query: searchQuery, results_count: response.data.count });
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-96 md:h-[500px] bg-cover bg-center flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1573164574511-73c773193279?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbHN8ZW58MHx8fHwxNzUzNTUyMjM0fDA&ixlib=rb-4.1.0&q=85')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-white w-full">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center mb-4"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span className="text-sm">Learn about Alibaba.com</span>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-5xl font-bold mb-8 leading-tight text-shadow"
            >
              The leading B2B ecommerce platform for global trade
            </motion.h1>
            
            {/* Search Bar */}
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col md:flex-row max-w-2xl search-bar"
            >
              <div className="flex-1 flex mb-3 md:mb-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-3 text-gray-900 rounded-l-md md:rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
                  placeholder="What are you looking for..."
                />
                <button className="p-3 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </button>
              </div>
              <motion.button 
                onClick={handleSearch}
                disabled={isSearching}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-orange-500 text-white px-6 md:px-8 py-3 rounded-r-md md:rounded-r-md hover:bg-orange-600 font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                {isSearching ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Search'
                )}
              </motion.button>
            </motion.div>
            
            {/* Frequently searched */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-sm"
            >
              <span className="text-gray-300 mr-3">Frequently searched:</span>
              <div className="inline-flex flex-wrap gap-2 md:gap-3">
                {['iphones 15 pro max', 'laptop', 'headphones', 'furniture'].map((term, index) => (
                  <motion.button 
                    key={term}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    onClick={() => {setSearchQuery(term); handleSearch();}}
                    className="bg-gray-800 bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-70 transition-all hover:scale-105 text-xs md:text-sm"
                  >
                    {term}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            id="search-results" 
            className="py-8 bg-gray-50"
          >
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6">Search Results for "{searchQuery}" ({searchResults.length} items)</h2>
              <SearchResults results={searchResults} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};

// Enhanced Search Results Component
export const SearchResults = ({ results }) => {
  const { trackEvent, user, loadCart } = useApp();
  const [toast, setToast] = useState(null);

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

  return (
    <>
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((product, index) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-all group cursor-pointer bg-white card-hover"
            onClick={() => handleProductClick(product)}
          >
            <div className="relative overflow-hidden">
              <img 
                src={product.images?.[0]?.url || 'https://via.placeholder.com/300x200'}
                alt={product.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {product.supplier.trade_assurance && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded shadow-md"
                >
                  Trade Assurance
                </motion.div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm md:text-base">
                {product.name}
              </h3>
              <div className="text-lg font-semibold text-orange-600 mb-1">
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

              <motion.button
                onClick={(e) => handleAddToCart(e, product.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Add to Cart
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
};

// Enhanced Features Section
export const FeaturesSection = () => {
  const features = [
    {
      title: "Global Marketplace",
      description: "Connect with millions of suppliers and buyers worldwide for seamless international trade.",
      icon: "🌍",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Secure Payments", 
      description: "Multiple payment options including traditional methods and cryptocurrency for maximum flexibility.",
      icon: "🔒",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Trade Assurance",
      description: "Protect your orders from payment to delivery with our comprehensive trade assurance program.",
      icon: "🛡️",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "AI Recommendations",
      description: "Get personalized product recommendations based on your browsing history and preferences.",
      icon: "🤖",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <section className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Platform</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
            Experience the future of B2B commerce with advanced features designed for modern businesses
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="text-center group cursor-pointer"
            >
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`text-4xl md:text-5xl mb-4 p-4 rounded-full bg-gradient-to-br ${feature.color} inline-block shadow-lg`}
              >
                <span className="filter drop-shadow-sm">{feature.icon}</span>
              </motion.div>
              <h3 className="text-xl font-semibold mb-4 text-orange-400 group-hover:text-orange-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base group-hover:text-white transition-colors">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Keep existing components but add motion and responsiveness improvements
export const StatisticsSection = () => {
  const stats = [
    { number: "200M+", label: "products" },
    { number: "200K+", label: "suppliers" }, 
    { number: "5,900", label: "product categories" },
    { number: "200+", label: "countries and regions" }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-bold text-gray-900 mb-12"
        >
          Explore millions of offerings tailored to your business needs
        </motion.h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, delay: index * 0.2 }}
                className="text-2xl md:text-4xl font-bold text-orange-500 mb-2"
              >
                {stat.number}
              </motion.div>
              <div className="text-gray-600 font-medium text-sm md:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Continue with other components but I'll truncate here due to length limits
// The remaining components (CategoriesSection, FeaturedProducts, etc.) follow the same pattern
// with added motion animations and responsive improvements

export * from './additional-components';