import React, { useState } from 'react';

// Header Component
export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');

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
                className="h-8"
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
              <button className="p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5M7 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
                </svg>
              </button>
              <button className="text-sm hover:text-orange-500">Sign in</button>
              <button className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
                Create account
              </button>
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

// Hero Section Component
export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('iphones 15 pro max');

  return (
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
                className="flex-1 px-4 py-3 text-gray-900 rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="What are you looking for..."
              />
              <button className="p-3 bg-white text-gray-600 hover:bg-gray-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </button>
            </div>
            <button className="bg-orange-500 text-white px-8 py-3 rounded-r-md hover:bg-orange-600 font-medium">
              Search
            </button>
          </div>
          
          {/* Frequently searched */}
          <div className="mt-4 text-sm">
            <span className="text-gray-300 mr-3">Frequently searched:</span>
            <div className="inline-flex space-x-3">
              <button className="bg-gray-800 bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-70">
                iphones 15 pro max
              </button>
              <button className="bg-gray-800 bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-70">
                tabubu
              </button>
              <button className="bg-gray-800 bg-opacity-50 px-3 py-1 rounded hover:bg-opacity-70">
                laptop
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Section Component
export const FeaturesSection = () => {
  const features = [
    {
      title: "offerings",
      description: "Explore products and suppliers for your business from millions of offerings worldwide."
    },
    {
      title: "transactions", 
      description: "Ensure production quality from verified suppliers, with your orders protected from payment to delivery."
    },
    {
      title: "solution",
      description: "Order seamlessly from product/supplier search to order management, payment, and fulfillment."
    },
    {
      title: "experience",
      description: "Get curated benefits, such as exclusive discounts, enhanced protection, and extra support, to help grow your business every step of the way."
    }
  ];

  return (
    <section className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
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

// Statistics Section Component
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

// Product Categories Component
export const CategoriesSection = () => {
  const categories = [
    {
      name: "Consumer Electronics",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljc3xlbnwwfHx8fDE3NTM1Mjc4ODF8MA&ixlib=rb-4.1.0&q=85",
      subcategories: ["Mobile Phones", "Laptops & Computers", "Audio & Video", "Smart Home"]
    },
    {
      name: "Apparel & Fashion",
      image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxhcHBhcmVsfGVufDB8fHx8MTc1MzUyNTM3NHww&ixlib=rb-4.1.0&q=85",
      subcategories: ["Men's Clothing", "Women's Fashion", "Kids & Baby", "Accessories"]
    },
    {
      name: "Machinery & Equipment",
      image: "https://images.unsplash.com/photo-1717386255773-1e3037c81788?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxtYWNoaW5lcnl8ZW58MHx8fHwxNzUzNTUyMjU0fDA&ixlib=rb-4.1.0&q=85",
      subcategories: ["Industrial Equipment", "Construction Machinery", "Agriculture", "Manufacturing"]
    },
    {
      name: "Home & Garden",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxob21lJTIwZnVybml0dXJlfGVufDB8fHx8MTc1MzU1MjI2MXww&ixlib=rb-4.1.0&q=85",
      subcategories: ["Furniture", "Home Decor", "Garden Supplies", "Kitchen & Dining"]
    },
    {
      name: "Beauty & Personal Care",
      image: "https://images.unsplash.com/photo-1676570092589-a6c09ecbb373?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBjb3NtZXRpY3N8ZW58MHx8fHwxNzUzNTUyMjY3fDA&ixlib=rb-4.1.0&q=85",
      subcategories: ["Skincare", "Makeup", "Hair Care", "Personal Hygiene"]
    },
    {
      name: "Logistics & Warehousing",
      image: "https://images.unsplash.com/photo-1553413077-190dd305871c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHx3YXJlaG91c2V8ZW58MHx8fHwxNzUzNTUyMjc0fDA&ixlib=rb-4.1.0&q=85",
      subcategories: ["Warehouse Equipment", "Packaging", "Shipping", "Storage Solutions"]
    }
  ];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Shop by Category
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <img 
                  src={category.image}
                  alt={category.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-opacity">
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                    <div className="space-y-1">
                      {category.subcategories.slice(0, 2).map((sub, idx) => (
                        <div key={idx} className="text-sm text-gray-200">{sub}</div>
                      ))}
                      <div className="text-sm text-orange-300">+{category.subcategories.length - 2} more</div>
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

// Featured Products Component
export const FeaturedProducts = () => {
  const products = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: "$25.00 - $45.00",
      minOrder: "100 pieces",
      supplier: "Shenzhen Tech Co., Ltd.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
      tradeAssurance: true,
      verified: true
    },
    {
      id: 2,
      name: "Cotton T-Shirts Bulk Order",
      price: "$3.50 - $8.00",
      minOrder: "500 pieces",
      supplier: "Guangzhou Apparel Factory",
      image: "https://images.unsplash.com/photo-1521497361130-eea3b8c96e4d?w=300&h=300&fit=crop",
      tradeAssurance: true,
      verified: true  
    },
    {
      id: 3,
      name: "Industrial Machinery Parts",
      price: "$120.00 - $280.00",
      minOrder: "50 pieces",
      supplier: "Beijing Manufacturing Ltd.",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop",
      tradeAssurance: false,
      verified: true
    },
    {
      id: 4,
      name: "Modern Office Chair",
      price: "$85.00 - $150.00", 
      minOrder: "20 pieces",
      supplier: "Foshan Furniture Co.",
      image: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=300&h=300&fit=crop",
      tradeAssurance: true,
      verified: false
    }
  ];

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
            <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
              <div className="relative">
                <img 
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.tradeAssurance && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                    Trade Assurance
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  {product.name}
                </h3>
                <div className="text-lg font-semibold text-orange-600 mb-1">
                  {product.price}
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  Min. order: {product.minOrder}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {product.supplier}
                  </div>
                  {product.verified && (
                    <div className="flex items-center text-xs text-blue-600">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Footer Component
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
              The leading B2B ecommerce platform for global trade
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
              <button className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600">
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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
              <li><a href="#" className="hover:text-white">Report Abuse</a></li>
              <li><a href="#" className="hover:text-white">Submit a Dispute</a></li>
              <li><a href="#" className="hover:text-white">Policies & Rules</a></li>
            </ul>
          </div>
          
          {/* Trade Services */}
          <div>
            <h3 className="font-semibold mb-4">Trade Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Trade Assurance</a></li>
              <li><a href="#" className="hover:text-white">Business Identity</a></li>
              <li><a href="#" className="hover:text-white">Logistics Service</a></li>
              <li><a href="#" className="hover:text-white">Production Monitoring</a></li>
            </ul>
          </div>
          
          {/* Sell on Alibaba */}
          <div>
            <h3 className="font-semibold mb-4">Sell on Alibaba.com</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Supplier Membership</a></li>
              <li><a href="#" className="hover:text-white">Learning Center</a></li>
              <li><a href="#" className="hover:text-white">Partner Program</a></li>
              <li><a href="#" className="hover:text-white">Country Channels</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="mb-4 md:mb-0">
            © 2025 Alibaba.com. All rights reserved.
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