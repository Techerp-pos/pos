import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ShopDetails from '../components/ShopDetails';
import DailySales from '../components/DailySales';
import Invoices from '../components/Invoices';
// import StockByDepartment from '../components/StockByDepartment';
// import Terminals from '../components/Terminals';

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
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Welcome, {currentUser.email}</h1>
                <button className="logout-button" onClick={handleLogout}>Log Out</button>
            </header>
            <main className="dashboard-main">
                <div className="dashboard-section">
                    <ShopDetails />
                </div>
                <div className="dashboard-section">
                    <DailySales />
                </div>
                <div className="dashboard-section">
                    <Invoices />
                </div>
                {/* Uncomment these sections when needed */}
                {/* <div className="dashboard-section">
                    <StockByDepartment />
                </div>
                <div className="dashboard-section">
                    <Terminals />
                </div> */}
            </main>
        </div>
    );
}

export default Dashboard;
