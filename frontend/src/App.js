import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { 
  AppProvider,
  useApp,
  Header, 
  HeroSection, 
  FeaturesSection, 
  StatisticsSection,
  PaymentModal,
  Footer 
} from "./components";
import {
  CategoriesSection,
  FeaturedProducts,
  RecommendationsSection
} from "./additional-components";

const Home = () => {
  const { user, loadCart, trackEvent } = useApp();

  useEffect(() => {
    // Track page view
    trackEvent('page_view', { page: 'home' });
    
    // Load user cart if logged in
    if (user?.id) {
      loadCart(user.id);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <StatisticsSection />
      <CategoriesSection />
      <FeaturedProducts />
      <RecommendationsSection />
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </div>
  );
};

export default App;