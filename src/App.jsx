import React, { useState, useEffect } from 'react';
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
import Settings from './components/Settings';
import DailySales from './components/DailySales';
import DayClose from './components/DayClose';
import AddShop from './components/AddShop';
import AddUser from './components/AddUser';
import AddProducts from './components/AddProducts';
import Product from './pages/Product';
import VendorForm from './components/VendorForm';
import VendorList from './components/VendorList';
import CustomerList from './components/CustomerList';
import Inventory from './components/InventoryList';
import LocalPurchaseOrder from './components/LocalPurchaseOrder';
import GoodsReceiveNote from './components/GoodsRecieveNote';
import ViewList from './components/ViewList';
import SalePOS from './components/SalePOS';
import SaleOrderPOS from './components/SaleOrderPOS';
import DayClosePOS from './components/DayClosePOS';
import GoodsReturnVoucher from './components/GoodsReturnVoucher';
import JournalEntry from './components/JournalEntry';
import JournalEntryList from './components/JournalEntryList';
import AccountsList from './components/AccountsList';
import ChartOfAccounts from './components/ChartofAccounts';
import Loader from './components/Loader'; // Import the Loader component
// import SalesReport from './components/SalesReport';
// import SaleByDepartment from './components/SaleByDepartment';
// import SalesByInvoice from './components/SalesByInvoice';
import Reports from './components/Reports';
import { QZTrayProvider } from './contexts/QzTrayContext';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading delay to represent fetching user data or similar operations
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // You can adjust the delay as needed

    return () => clearTimeout(timer);
  }, []);

  if (loading) {

    return (<div className="main-content">
      <Loader />
    </div>);
  }

  return currentUser ? (
    <>
      <QZTrayProvider>
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
            <Route path="/sale-order" element={<SaleOrderPOS />} />
            <Route path='/sale' element={<SalePOS />} />
            <Route path='/settings' element={<Settings />} />
            <Route path='/day-close' element={<DayClosePOS />} />
            <Route path='/add-shop' element={<AddShop />} />
            <Route path='/add-user' element={<AddUser />} />
            <Route path='/add-products' element={<AddProducts />} />
            <Route path='/product-page' element={<Product />} />
            <Route path='/vendor' element={<VendorList />} />
            <Route path='/customer-page' element={<CustomerList />} />
            <Route path='/inventory' element={<Inventory />} />
            <Route path='/lpo' element={<LocalPurchaseOrder />} />
            <Route path='grn' element={<GoodsReceiveNote />} />
            <Route path='/view-list' element={<ViewList />} />
            <Route path="/grv-list" element={<ViewList orderType="GRV" />} />
            <Route path='/grv' element={<GoodsReturnVoucher />} />
            <Route path='/journal' element={<JournalEntryList />} />
            <Route path='/accounts' element={<AccountsList />} />
            <Route path='/charts' element={<ChartOfAccounts />} />
            <Route path='/reports' element={<Reports />} />
            {/* <Route path='/t' element={<SaleByDepartment />} />
          <Route path='/tt' element={<SalesByInvoice />} /> */}
          </Routes>
        </div>
      </QZTrayProvider>
    </>
  ) : (
    <Navigate to="/login" />
  );
}

export default App;
