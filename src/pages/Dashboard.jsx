import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ShopDetails from '../components/ShopDetails';
import DailySales from '../components/DailySales';
import Invoices from '../components/Invoices';
import StockByDepartment from '../components/StockByDepartment';
import Terminals from '../components/Terminals';

function Dashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            alert('Failed to log out');
        }
    };

    return (
        <div>
            <h1>Welcome, {currentUser.email}</h1>
            <button onClick={handleLogout}>Log Out</button>
            <ShopDetails />
            <DailySales />
            <Invoices />
            {/* <StockByDepartment />
            <Terminals /> */}
        </div>
    );
}

export default Dashboard;
