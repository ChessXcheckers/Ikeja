import React, { useState, useEffect, useContext, createContext } from 'react';
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

// Enhanced Header Component with Cart
export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const { user, cart, sessionId, trackEvent, loadCart } = useApp();

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    try {
      const response = await axios.get(`${API}/search`, {
        params: {
          q: query,
          user_id: user?.id,
          session_id: sessionId
        }
      });
      setSearchResults(response.data.products);
      
      // Track search event
      await trackEvent('search', { query, results_count: response.data.count });
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    if (!user) {
      alert('Please sign in to add items to cart');
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
      
      alert('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    }
  };

  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="font-semibold">COCREATE 2025</span>
            <span>|</span>
            <span>Explore 20K+ top products & suppliers in person</span>
          </div>
          <div className="bg-orange-700 px-3 py-1 rounded text-xs font-medium">
            Use code: savemore
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top row */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-8">
              <img 
                src="https://s.alicdn.com/@img/imgextra/i2/O1CN01BZJqlo1h4aYHpvdYl_!!6000000004223-2-tps-196-50.png" 
                alt="Alibaba.com"
                className="h-8 cursor-pointer"
                onClick={() => window.location.href = '/'}
              />
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <span>Deliver to:</span>
                <div className="flex items-center space-x-1">
                  <img src="https://flagcdn.com/w20/us.png" alt="US" className="w-4 h-3" />
                  <span className="font-medium">US</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm">
                <span>English-USD</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Cart Icon */}
              <div className="relative">
                <button 
                  className="p-2 relative"
                  onClick={() => setShowCart(!showCart)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
                  </svg>
                  {cart && cart.summary.item_count > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.summary.item_count}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                {showCart && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-lg rounded-lg z-50 border">
                    <div className="p-4">
                      <h3 className="font-semibold mb-3">Shopping Cart</h3>
                      {cart && cart.items.length > 0 ? (
                        <>
                          {cart.items.slice(0, 3).map((item) => (
                            <div key={item.product_id} className="flex items-center space-x-3 mb-3 pb-3 border-b">
                              <img src={item.product_image} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.product_name}</div>
                                <div className="text-gray-500 text-xs">Qty: {item.quantity}</div>
                                <div className="text-orange-600 font-semibold">${item.total_price}</div>
                              </div>
                            </div>
                          ))}
                          <div className="text-center">
                            <div className="font-semibold mb-2">Total: ${cart.summary.total}</div>
                            <button className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600 w-full">
                              View Cart & Checkout
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          Your cart is empty
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Hello, {user.full_name}</span>
                  <button 
                    className="text-sm hover:text-orange-500"
                    onClick={() => setUser(null)}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    className="text-sm hover:text-orange-500"
                    onClick={() => setUser({ id: 'user_001', full_name: 'John Smith', email: 'john@example.com' })}
                  >
                    Sign in
                  </button>
                  <button className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
                    Create account
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-8 py-3 border-t text-sm">
            <button className="flex items-center space-x-1 hover:text-orange-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>All categories</span>
            </button>
            <a href="#" className="hover:text-orange-500">Featured selections</a>
            <a href="#" className="hover:text-orange-500">Order protections</a>
            <a href="#" className="hover:text-orange-500">AI sourcing agent</a>
            <a href="#" className="hover:text-orange-500">Buyer Central</a>
            <a href="#" className="hover:text-orange-500">Help Center</a>
            <a href="#" className="hover:text-orange-500">App & extension</a>
            <a href="#" className="hover:text-orange-500">Become a supplier</a>
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
  const { user, sessionId, trackEvent } = useApp();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
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
      document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <>
      <section 
        className="relative h-96 bg-cover bg-center flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1573164574511-73c773193279?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbHN8ZW58MHx8fHwxNzUzNTUyMjM0fDA&ixlib=rb-4.1.0&q=85')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-white">
          <div className="max-w-2xl">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <span className="text-sm">Learn about Alibaba.com</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              The leading B2B ecommerce platform for global trade
            </h1>
            
            {/* Search Bar */}
            <div className="flex max-w-2xl">
              <div className="flex-1 flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-3 text-gray-900 rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="What are you looking for..."
                />
                <button className="p-3 bg-white text-gray-600 hover:bg-gray-50">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </button>
              </div>
              <button 
                onClick={handleSearch}
                className="bg-orange-500 text-white px-8 py-3 rounded-r-md hover:bg-orange-600 font-medium"
              >
                Search
              </button>
            </div>
            
            {/* Frequently searched */}
            <div className="mt-4 text-sm">
              <span className="text-gray-300 mr-3">Frequently searched:</span>
              <div className="inline-flex space-x-3">
                {['iphones 15 pro max', 'tabubu', 'laptop', 'headphones'].map((term) => (
                  <button 
                    key={term}
                    onClick={() => {setSearchQuery(term); handleSearch();}}
                    className="bg-gray-800 bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-70"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section id="search-results" className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Search Results for "{searchQuery}"</h2>
            <SearchResults results={searchResults} />
          </div>
        </section>
      )}
    </>
  );
};

// Search Results Component
export const SearchResults = ({ results }) => {
  const { trackEvent, user } = useApp();

  const handleProductClick = async (product) => {
    await trackEvent('product_view', { 
      product_id: product.id,
      product_name: product.name,
      category: product.category
    });
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    if (!user) {
      alert('Please sign in to add items to cart');
      return;
    }

    try {
      await axios.post(`${API}/cart/${user.id}/items`, null, {
        params: { product_id: productId, quantity }
      });
      
      await trackEvent('cart_add', { product_id: productId, quantity });
      alert('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {results.map((product) => (
        <div 
          key={product.id} 
          className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer bg-white"
          onClick={() => handleProductClick(product)}
        >
          <div className="relative">
            <img 
              src={product.images?.[0]?.url || 'https://via.placeholder.com/300x200'}
              alt={product.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.supplier.trade_assurance && (
              <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                Trade Assurance
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
            <div className="text-lg font-semibold text-orange-600 mb-1">
              ${product.pricing.min_price} - ${product.pricing.max_price}
            </div>
            <div className="text-sm text-gray-500 mb-3">
              Min. order: {product.min_order_quantity} pieces
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">
                {product.supplier.name}
              </div>
              {product.supplier.verification_status && (
                <div className="flex items-center text-xs text-blue-600">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product.id);
              }}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Enhanced Features Section
export const FeaturesSection = () => {
  const features = [
    {
      title: "Global Marketplace",
      description: "Connect with millions of suppliers and buyers worldwide for seamless international trade.",
      icon: "🌍"
    },
    {
      title: "Secure Payments", 
      description: "Multiple payment options including traditional methods and cryptocurrency for maximum flexibility.",
      icon: "🔒"
    },
    {
      title: "Trade Assurance",
      description: "Protect your orders from payment to delivery with our comprehensive trade assurance program.",
      icon: "🛡️"
    },
    {
      title: "AI Recommendations",
      description: "Get personalized product recommendations based on your browsing history and preferences.",
      icon: "🤖"
    }
  ];

  return (
    <section className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Experience the future of B2B commerce with advanced features designed for modern businesses
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4 text-orange-400">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Statistics Section (same as before)
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
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
          Explore millions of offerings tailored to your business needs
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Enhanced Categories Section with Real Data
export const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const { trackEvent } = useApp();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axios.get(`${API}/categories`);
        setCategories(response.data.categories);
      } catch (error) {
        console.error('Error loading categories:', error);
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

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Shop by Category
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="group cursor-pointer"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <img 
                  src={categoryImages[category.name] || 'https://via.placeholder.com/400x300'}
                  alt={category.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-opacity">
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-semibold mb-2 capitalize">
                      {category.name.replace('_', ' & ')}
                    </h3>
                    <div className="text-sm text-gray-200 mb-2">
                      {category.count} products
                    </div>
                    <div className="space-y-1">
                      {category.subcategories.slice(0, 2).map((sub, idx) => (
                        <div key={idx} className="text-sm text-gray-200">{sub}</div>
                      ))}
                      {category.subcategories.length > 2 && (
                        <div className="text-sm text-orange-300">
                          +{category.subcategories.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Enhanced Featured Products with Real Data
export const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const { trackEvent, user } = useApp();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await axios.get(`${API}/products?limit=8`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, []);

  const handleProductClick = async (product) => {
    await trackEvent('product_view', { 
      product_id: product.id,
      product_name: product.name,
      category: product.category
    });
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    if (!user) {
      alert('Please sign in to add items to cart');
      return;
    }

    try {
      await axios.post(`${API}/cart/${user.id}/items`, null, {
        params: { product_id: productId, quantity }
      });
      
      await trackEvent('cart_add', { product_id: productId, quantity });
      alert('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error adding item to cart');
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <button className="text-orange-500 hover:text-orange-600 font-medium">
            View all products →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/300x200'}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.supplier.trade_assurance && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    Trade Assurance
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
                <div className="text-lg font-semibold text-orange-600 mb-1">
                  ${product.pricing.min_price} - ${product.pricing.max_price}
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  Min. order: {product.min_order_quantity} pieces
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">
                    {product.supplier.name}
                  </div>
                  {product.supplier.verification_status && (
                    <div className="flex items-center text-xs text-blue-600">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product.id);
                  }}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Recommendations Section
export const RecommendationsSection = () => {
  const { recommendations, user, sessionId, loadRecommendations } = useApp();

  useEffect(() => {
    if (user || sessionId) {
      loadRecommendations();
    }
  }, [user, sessionId]);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {user ? 'Recommended for You' : 'You Might Also Like'}
          </h2>
          <button 
            onClick={loadRecommendations}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Refresh →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.slice(0, 4).map((rec) => (
            <div key={rec.product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
              <div className="relative">
                <img 
                  src={rec.product.images?.[0]?.url || 'https://via.placeholder.com/300x200'}
                  alt={rec.product.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  {Math.round(rec.score * 100)}% match
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {rec.product.name}
                </h3>
                <div className="text-lg font-semibold text-orange-600 mb-2">
                  ${rec.product.pricing.min_price} - ${rec.product.pricing.max_price}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  {rec.reasons.join(', ')}
                </div>
                <button className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors">
                  View Product
                </button>
              </div>
            </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Payment Options</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="text-lg font-semibold text-center mb-4">
            Total: ${amount} {currency}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <span>Credit/Debit Card (Flutterwave)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="payment"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <span>Bank Transfer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="payment"
                  value="crypto"
                  checked={paymentMethod === 'crypto'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-2"
                />
                <span>Cryptocurrency (Trustless)</span>
              </label>
            </div>
          </div>

          {paymentMethod === 'crypto' && (
            <div>
              <label className="block text-sm font-medium mb-2">Crypto Currency</label>
              <select
                value={cryptoMethod}
                onChange={(e) => setCryptoMethod(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="bitcoin">Bitcoin (BTC)</option>
                <option value="ethereum">Ethereum (ETH)</option>
                <option value="usdt">Tether (USDT)</option>
                <option value="usdc">USD Coin (USDC)</option>
              </select>
            </div>
          )}

          {paymentResponse && paymentResponse.crypto_address && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Send Payment To:</h3>
              <div className="text-sm font-mono bg-white p-2 rounded border break-all">
                {paymentResponse.crypto_address}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Amount: {paymentResponse.provider_response.crypto_amount} {cryptoMethod.toUpperCase()}
              </div>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Pay $${amount} ${currency}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// Footer Component (same as before)
export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <img 
              src="https://s.alicdn.com/@img/imgextra/i2/O1CN01BZJqlo1h4aYHpvdYl_!!6000000004223-2-tps-196-50.png" 
              alt="Alibaba.com"
              className="h-8 mb-4 filter brightness-0 invert"
            />
            <p className="text-gray-400 text-sm mb-4">
              The leading B2B ecommerce platform for global trade with advanced payment solutions
            </p>
            <div className="flex space-x-4">
              <button className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600">
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </button>
              <button className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600">
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">Payment Support</a></li>
              <li><a href="#" className="hover:text-white">Crypto Payments</a></li>
              <li><a href="#" className="hover:text-white">Policies & Rules</a></li>
            </ul>
          </div>
          
          {/* Trade Services */}
          <div>
            <h3 className="font-semibold mb-4">Trade Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Trade Assurance</a></li>
              <li><a href="#" className="hover:text-white">Verified Suppliers</a></li>
              <li><a href="#" className="hover:text-white">Logistics Service</a></li>
              <li><a href="#" className="hover:text-white">AI Recommendations</a></li>
            </ul>
          </div>
          
          {/* Sell on Alibaba */}
          <div>
            <h3 className="font-semibold mb-4">Sell on Platform</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Supplier Membership</a></li>
              <li><a href="#" className="hover:text-white">Learning Center</a></li>
              <li><a href="#" className="hover:text-white">Analytics Dashboard</a></li>
              <li><a href="#" className="hover:text-white">Payment Solutions</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="mb-4 md:mb-0">
            © 2025 Alibaba Clone. All rights reserved. | Powered by AI & Blockchain
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Use</a>
            <a href="#" className="hover:text-white">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};