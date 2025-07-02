import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Context for authentication and cart
const AuthContext = createContext();
const CartContext = createContext();

// Custom hooks
const useAuth = () => useContext(AuthContext);
const useCart = () => useContext(CartContext);

// API base URL
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Utility functions
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

const StarRating = ({ rating, className = "" }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push(<span key={i} className="text-yellow-400">★</span>);
  }
  
  if (hasHalfStar) {
    stars.push(<span key="half" className="text-yellow-400">☆</span>);
  }
  
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
  }
  
  return <div className={`flex ${className}`}>{stars}</div>;
};

// Authentication Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Verify token and get user data
      fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.detail };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.detail };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Cart Provider
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total_amount: 0 });
  const [cartCount, setCartCount] = useState(0);
  const { token } = useAuth();

  const fetchCart = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        setCartCount(data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId, quantity, price) => {
    if (!token) return { success: false, error: 'Please login to add items to cart' };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: productId,
          quantity,
          price
        })
      });
      
      if (response.ok) {
        await fetchCart();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.detail };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const removeFromCart = async (productId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const value = {
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    fetchCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Components
const Header = ({ onAuthClick, onCartClick }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <header className="bg-black text-white sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold tracking-tight">ikeja</h1>
            <nav className="hidden md:flex space-x-6">
              <a href="#phones" className="hover:text-gray-300 transition-colors">Smartphones</a>
              <a href="#gaming" className="hover:text-gray-300 transition-colors">Gaming</a>
              <a href="#deals" className="hover:text-gray-300 transition-colors">Deals</a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onCartClick}
              className="relative p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="hidden md:inline">Hi, {user.full_name}</span>
                <button
                  onClick={logout}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/2330137/pexels-photo-2330137.jpeg)'
        }}
      />
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Elevate Your
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Digital Life
          </span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
          Discover premium smartphones and gaming gear that transforms how you connect, create, and conquer.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105">
            Shop Smartphones
          </button>
          <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-black transition-all transform hover:scale-105">
            Gaming Gear
          </button>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-purple-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
    </section>
  );
};

const ProductCard = ({ product, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  
  const discount = product.original_price ? 
    Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-64 object-cover"
        />
        
        {/* Overlays */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.is_featured && (
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              FEATURED
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discount}%
            </span>
          )}
        </div>
        
        {product.stock_quantity <= 10 && (
          <div className="absolute top-4 right-4">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              Only {product.stock_quantity} left!
            </span>
          </div>
        )}
        
        {/* Quick add button */}
        <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onAddToCart(product)}
            className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors transform hover:scale-105"
          >
            Quick Add to Cart
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 font-medium">{product.brand}</span>
          <StarRating rating={product.rating} className="text-sm" />
        </div>
        
        <h3 className="text-xl font-bold mb-2 text-gray-900">{product.name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.original_price && (
              <span className="text-lg text-gray-500 line-through">{formatPrice(product.original_price)}</span>
            )}
          </div>
          <span className="text-sm text-gray-500">({product.review_count} reviews)</span>
        </div>
        
        {/* Key specs */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <button
          onClick={() => onAddToCart(product)}
          disabled={!user}
          className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {user ? 'Add to Cart' : 'Sign In to Purchase'}
        </button>
        
        {/* Social proof */}
        <div className="mt-3 text-center text-sm text-gray-500">
          <span className="inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {Math.floor(Math.random() * 50) + 10} purchased this week
          </span>
        </div>
      </div>
    </div>
  );
};

const ProductGrid = ({ products, onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Premium Collection</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Handpicked devices that redefine excellence. Every product tells a story of innovation.
          </p>
        </div>
        
        {/* Category filters */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-full p-2 shadow-lg">
            {[
              { key: 'all', label: 'All Products' },
              { key: 'smartphones', label: 'Smartphones' },
              { key: 'gaming', label: 'Gaming' }
            ].map(category => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeCategory === category.key
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.email, formData.password, formData.fullName);
      }

      if (result.success) {
        onClose();
        setFormData({ email: '', password: '', fullName: '' });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isLogin ? 'Welcome Back' : 'Join ikeja'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-600 hover:text-black transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CartModal = ({ isOpen, onClose }) => {
  const { cart, removeFromCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState({});

  // Fetch product details for cart items
  useEffect(() => {
    if (cart.items && cart.items.length > 0) {
      const fetchProductDetails = async () => {
        const productDetails = {};
        for (const item of cart.items) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/products/${item.product_id}`);
            if (response.ok) {
              const product = await response.json();
              productDetails[item.product_id] = product;
            }
          } catch (error) {
            console.error('Error fetching product details:', error);
          }
        }
        setProducts(productDetails);
      };
      fetchProductDetails();
    }
  }, [cart.items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!user ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Please sign in to view your cart</p>
            <button
              onClick={onClose}
              className="bg-black text-white px-6 py-2 rounded-full"
            >
              Sign In
            </button>
          </div>
        ) : cart.items?.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9" />
            </svg>
            <p className="text-gray-600">Your cart is empty</p>
          </div>
        ) : (
          <div>
            <div className="space-y-4 mb-6">
              {cart.items.map(item => {
                const product = products[item.product_id];
                return (
                  <div key={item.product_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {product?.images?.[0] && (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{product?.name || `Product ${item.product_id}`}</h4>
                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                        <p className="text-gray-600">{formatPrice(item.price)} each</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold">{formatPrice(cart.total_amount)}</span>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                >
                  Continue Shopping
                </button>
                <button className="flex-1 bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors">
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <AppContent 
          products={products}
          authModalOpen={authModalOpen}
          setAuthModalOpen={setAuthModalOpen}
          cartModalOpen={cartModalOpen}
          setCartModalOpen={setCartModalOpen}
        />
      </CartProvider>
    </AuthProvider>
  );
};

const AppContent = ({ products, authModalOpen, setAuthModalOpen, cartModalOpen, setCartModalOpen }) => {
  const { addToCart } = useCart();

  const handleAddToCart = async (product) => {
    const result = await addToCart(product.id, 1, product.price);
    
    if (result.success) {
      // Show success feedback
      console.log('Product added to cart successfully');
    } else {
      // Show error feedback
      console.error('Failed to add product to cart:', result.error);
      if (result.error.includes('login')) {
        setAuthModalOpen(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onAuthClick={() => setAuthModalOpen(true)}
        onCartClick={() => setCartModalOpen(true)}
      />
      
      <main>
        <Hero />
        <ProductGrid 
          products={products} 
          onAddToCart={handleAddToCart}
        />
      </main>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
      
      <CartModal 
        isOpen={cartModalOpen} 
        onClose={() => setCartModalOpen(false)} 
      />
    </div>
  );
};

export default App;