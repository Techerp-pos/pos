import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import ProductList from './components/ProductList';
import AddEditProduct from './components/AddEditProduct';
import Departments from './components/Departments';
import Terminals from './components/Terminals';
import Header from './components/Header';
import LoginSignup from './pages/LoginSignup';
import AddCategory from './components/AddCategory';
import SaleOrder from './components/SaleOrder';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sale from './components/Sale';
import Settings from './components/Settings';
import DailySales from './components/DailySales';
import DayClose from './components/DayClose';

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<LoginSignup />} />
            <Route path="*" element={<PrivateRoutes />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

function PrivateRoutes() {
  const { currentUser } = useAuth();

  return currentUser ? (
    <>
      <Header />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/product" element={<ProductList />} />
          <Route path="/add-product" element={<AddEditProduct />} />
          <Route path="/edit-product/:id" element={<AddEditProduct />} />
          <Route path="/product-listing" element={<ProductList />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/terminals" element={<Terminals />} />
          <Route path="/add-category" element={<AddCategory />} />
          <Route path="/sale-order" element={<SaleOrder />} />
          <Route path='/sale' element={<Sale />} />
          <Route path='/settings' element={<Settings />} />
          <Route path='/day-close' element={<DayClose />} />
        </Routes>
      </div>
    </>
  ) : (
    <Navigate to="/login" />
  );
}

export default App;
